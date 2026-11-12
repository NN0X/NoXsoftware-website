"""Runs F1Ratings (github.com/NN0X/F1Ratings) and writes the ratings as JSON for the website.

    python export.py --repo /path/to/F1Ratings --out f1.json            # real data from Kaggle
    python export.py --repo /path/to/F1Ratings --out f1.json --fixture  # synthetic data, for local dev

F1Ratings is used as a library, unmodified. It needs Python 3.12+ and its own requirements.txt.
"""

import argparse
import contextlib
import json
import os
import subprocess
import sys
import tempfile
from datetime import date, datetime, timezone

HISTORY_DRIVERS = 40  # all-time top drivers that get a rating history, on top of the current grid
RECENT_POINTS = 30    # every race this far back is kept; older history keeps one point per season


def parse_args():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--repo", required=True, help="path to a checkout of NN0X/F1Ratings")
    parser.add_argument("--out", required=True, help="where to write the JSON")
    parser.add_argument("--fixture", action="store_true", help="use a synthetic dataset instead of Kaggle")
    parser.add_argument("--verbose", action="store_true", help="keep F1Ratings' per-race progress output")
    return parser.parse_args()


def iso(value):
    return value.isoformat() if isinstance(value, (date, datetime)) else None


def history(ratings):
    """One point per season end, plus every race in the last RECENT_POINTS."""
    points = []
    for i, (rating, when) in enumerate(ratings):
        is_recent = i >= len(ratings) - RECENT_POINTS
        next_when = ratings[i + 1][1] if i + 1 < len(ratings) else None
        is_season_end = next_when is None or when is None or getattr(next_when, "year", None) != getattr(when, "year", None)
        if (is_recent or is_season_end) and when is not None:
            points.append([iso(when), round(rating)])
    return points


def entry(name, ratings, on_grid, with_history):
    current = ratings[-1][0]
    peak_rating, peak_date = max(ratings, key=lambda r: r[0])
    item = {
        "name": name,
        "current": round(current),
        "peak": round(peak_rating),
        "peakDate": iso(peak_date),
        # the same number `python main.py change <name>` prints
        "change": round(current - ratings[-2][0], 2) if len(ratings) > 1 else None,
        "changeDate": iso(ratings[-1][1]),
        "onGrid": on_grid,
    }
    if with_history:
        item["history"] = history(ratings)
    return item


def commit_of(repo):
    try:
        return subprocess.run(["git", "-C", repo, "rev-parse", "HEAD"], capture_output=True, text=True, check=True).stdout.strip()
    except (OSError, subprocess.CalledProcessError):
        return None


def main():
    args = parse_args()
    repo = os.path.abspath(args.repo)
    out = os.path.abspath(args.out)
    sys.path.insert(0, repo)
    import f1ratings
    from f1ratings import api
    from f1ratings.helpers import get_last_race_drivers, get_last_race_teams

    if args.fixture:
        import fixture
        api.fetch_data = fixture.load

    # F1Ratings writes a ratings/ directory into the working directory; keep that out of the way.
    # It also prints a line per race, which would flood the journal on the Pi.
    with tempfile.TemporaryDirectory() as work, open(os.devnull, "w") as devnull:
        quiet = contextlib.nullcontext() if args.verbose else contextlib.redirect_stdout(devnull)
        os.chdir(work)
        with quiet:
            ratings = f1ratings.F1Ratings()
            ratings.fetch()
            ratings.compute()

    grid_drivers = get_last_race_drivers(ratings.drivers, ratings.races)
    grid_teams = get_last_race_teams(ratings.teams, ratings.races)
    rated_drivers = [d for d in ratings.drivers if d.ratings]
    rated_teams = [t for t in ratings.teams if t.ratings]
    top_peak = sorted(rated_drivers, key=lambda d: max(r[0] for r in d.ratings), reverse=True)[:HISTORY_DRIVERS]

    drivers = [
        entry(f"{d.forename} {d.surname}", d.ratings, d in grid_drivers, d in grid_drivers or d in top_peak)
        for d in rated_drivers
    ]
    teams = [entry(t.name, t.ratings, t in grid_teams, True) for t in rated_teams]
    # get_last_race_* sort the race list in place, so pick the latest race explicitly
    last_race = max(ratings.races, key=lambda r: r.date) if ratings.races else None

    data = {
        "generated": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": {
            "repo": "NN0X/F1Ratings",
            "commit": commit_of(repo),
            "dataset": "jtrotman/formula-1-race-data",
        },
        "fixture": args.fixture,
        "lastRace": {"name": last_race.name, "date": iso(last_race.date)} if last_race else None,
        "drivers": sorted(drivers, key=lambda d: d["current"], reverse=True),
        "teams": sorted(teams, key=lambda t: t["current"], reverse=True),
    }

    # write next to the target and rename, so a reader never sees half a file
    os.makedirs(os.path.dirname(out) or ".", exist_ok=True)
    tmp = out + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
    os.replace(tmp, out)
    print(f"wrote {len(drivers)} drivers and {len(teams)} teams to {out}")


if __name__ == "__main__":
    main()
