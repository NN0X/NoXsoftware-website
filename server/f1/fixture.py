"""A small synthetic stand-in for the Kaggle dataset, shaped like the CSVs F1Ratings reads.

Used by `export.py --fixture` (and `npm run f1:fixture`) so the site can be developed without
Kaggle access. Deterministic: the same date gives the same file. Every season from 1950 gets at
least one race, because F1Ratings divides by the length of each season.
"""

import random
from datetime import date, timedelta

import pandas as pd

DRIVERS = [
    ("Ada", "Lovelace"), ("Alan", "Turing"), ("Grace", "Hopper"), ("Dennis", "Ritchie"),
    ("Ken", "Thompson"), ("Linus", "Torvalds"), ("Bjarne", "Stroustrup"), ("Margaret", "Hamilton"),
    ("Edsger", "Dijkstra"), ("Barbara", "Liskov"), ("Donald", "Knuth"), ("John", "Carmack"),
    ("Niklaus", "Wirth"), ("Frances", "Allen"),
]
RETIRED = {13, 14}  # driver ids that stop racing before the last seasons
TEAMS = ["Ferrari", "McLaren", "Williams", "Lotus", "Brabham", "Tyrrell"]
STATUSES = [(1, "Finished"), (3, "Accident"), (4, "Collision"), (5, "Engine"), (11, "+1 Lap"), (20, "Spun off")]


def season_dates(year, today):
    """Two rounds a season, eight in the last three; never in the future."""
    rounds = 8 if year >= today.year - 2 else 2
    start = date(year, 3, 1)
    days = [start + timedelta(days=21 * i) for i in range(rounds)]
    return [d for d in days if d <= today] or [min(start, today)]


def load():
    rng = random.Random(1950)
    today = date.today()
    skill = {i: rng.uniform(0.0, 1.0) for i in range(1, len(DRIVERS) + 1)}
    races, results, qualifying, sprints = [], [], [], []
    race_id = 0
    result_id = 0
    for year in range(1950, today.year + 1):
        active = [d for d in skill if not (d in RETIRED and year >= today.year - 2)]
        seats = rng.sample(active, 12)
        for n, when in enumerate(season_dates(year, today), start=1):
            race_id += 1
            races.append({"raceId": race_id, "year": year, "round": n, "circuitId": n,
                          "name": f"Grand Prix {n}", "date": when.isoformat()})
            pace = {d: skill[d] + rng.gauss(0, 0.35) for d in seats}
            grid = sorted(seats, key=lambda d: -pace[d] - rng.gauss(0, 0.2))
            order = sorted(seats, key=lambda d: -pace[d])
            for q, d in enumerate(grid, start=1):
                qualifying.append({"raceId": race_id, "driverId": d, "constructorId": seats.index(d) // 2 + 1, "position": q})
            for p, d in enumerate(order, start=1):
                result_id += 1
                status = 1 if rng.random() > 0.12 else rng.choice([3, 4, 5, 20])
                results.append({
                    "resultId": result_id, "raceId": race_id, "driverId": d, "constructorId": seats.index(d) // 2 + 1,
                    "grid": grid.index(d) + 1, "position": str(p) if status == 1 else "\\N", "statusId": status,
                    "time": "1:32:0%d.%03d" % (p % 10, p) if p == 1 and status == 1 else "\\N",
                })
            if n % 4 == 0:
                for p, d in enumerate(order, start=1):
                    sprints.append({"raceId": race_id, "driverId": d, "constructorId": seats.index(d) // 2 + 1,
                                    "position": str(p), "statusId": 1, "grid": grid.index(d) + 1,
                                    "time": "0:30:01.000" if p == 1 else "+%d.000" % p})
    return {
        "drivers": pd.DataFrame([{"driverId": i, "forename": f, "surname": s} for i, (f, s) in enumerate(DRIVERS, start=1)]),
        "constructors": pd.DataFrame([{"constructorId": i, "name": n} for i, n in enumerate(TEAMS, start=1)]),
        "races": pd.DataFrame(races),
        "results": pd.DataFrame(results),
        "qualifying": pd.DataFrame(qualifying),
        "sprint_results": pd.DataFrame(sprints),
        "status": pd.DataFrame([{"statusId": i, "status": s} for i, s in STATUSES]),
    }
