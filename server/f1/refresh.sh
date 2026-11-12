#!/usr/bin/env bash
# Regenerates the F1 ratings shown on the site. Runs on the Raspberry Pi from a systemd timer
# (see server/README.md); also works locally: `npm run f1`.
#
# It clones (or updates) NN0X/F1Ratings, installs its requirements into a private virtualenv,
# runs it through export.py and replaces the published JSON atomically. If anything fails, the
# previous file stays in place, so the site keeps showing the last good ratings.
#
# Kaggle: the dataset is public, so no account is needed. If Kaggle starts asking for one, put
# an API token in ~/.kaggle/kaggle.json of the user running this script.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
OUT="$(realpath -m "${F1_OUT:-/var/www/noxsoftware-data/f1.json}")"
WORK="${F1_WORK:-${XDG_CACHE_HOME:-$HOME/.cache}/noxsoftware-f1}"
PYTHON="${F1_PYTHON:-python3}"
REPO_URL="https://github.com/NN0X/F1Ratings.git"
# extra arguments (--fixture, --verbose) go straight to export.py
EXTRA=("$@")

"$PYTHON" -c 'import sys; sys.exit(0 if sys.version_info >= (3, 12) else 1)' \
        || { echo "F1Ratings needs Python 3.12 or newer (set F1_PYTHON)" >&2; exit 1; }

mkdir -p "$WORK"
if [ -d "$WORK/F1Ratings/.git" ]
then
        git -C "$WORK/F1Ratings" fetch --quiet --depth 1 origin
        git -C "$WORK/F1Ratings" reset --quiet --hard FETCH_HEAD
else
        git clone --quiet --depth 1 "$REPO_URL" "$WORK/F1Ratings"
fi

# reinstall the requirements only when they change
REQS="$WORK/F1Ratings/requirements.txt"
STAMP="$WORK/venv/.requirements.sha256"
if [ ! -x "$WORK/venv/bin/python" ] || ! sha256sum --status -c "$STAMP" 2>/dev/null
then
        rm -rf "$WORK/venv"
        "$PYTHON" -m venv "$WORK/venv"
        "$WORK/venv/bin/pip" install --quiet --upgrade pip
        "$WORK/venv/bin/pip" install --quiet -r "$REQS" pandas
        sha256sum "$REQS" > "$STAMP"
fi

cd "$HERE"
"$WORK/venv/bin/python" export.py --repo "$WORK/F1Ratings" --out "$OUT" "${EXTRA[@]}"
