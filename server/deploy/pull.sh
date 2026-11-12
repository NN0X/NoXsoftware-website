#!/usr/bin/env bash
# Deploys the newest build of noxsoftware.pl. Runs on the Raspberry Pi from a systemd timer
# (see server/README.md).
#
# .github/workflows/deploy.yml publishes every push to master as the assets of the "site" release.
# This script compares that release's VERSION with what is live and, when it changed, downloads
# the archive, checks it, unpacks it into releases/<commit>/ and points the `current` symlink at it
# in one atomic rename. Apache serves current/site; the F1 data lives elsewhere and is untouched.
#
#   pull.sh             deploy if there is a newer build
#   pull.sh --rollback  go back to the previous release still on disk, and stay there
#   pull.sh --force     deploy the published build even if it is live, and end a rollback
set -euo pipefail

REPO="${NOX_REPO:-NN0X/NoXsoftware-website}"
ROOT="${NOX_ROOT:-/var/www/noxsoftware}"
KEEP="${NOX_KEEP:-3}"
BASE="${NOX_BASE:-https://github.com/$REPO/releases/download/site}"
PIN="$ROOT/.pinned"

die()
{
        echo "pull.sh: $*" >&2
        exit 1
}

switch_to()
{
        ln -sfn "releases/$1" "$ROOT/.current.new"
        mv -Tf "$ROOT/.current.new" "$ROOT/current"
        echo "live: $1"
}

mkdir -p "$ROOT/releases"
live="$(basename "$(readlink "$ROOT/current" 2>/dev/null || echo none)")"

if [ "${1:-}" = "--rollback" ]
then
        previous="$(ls -1t "$ROOT/releases" | { grep -vx "$live" || true; } | head -n 1)"
        [ -n "$previous" ] || die "no earlier release on disk to roll back to"
        switch_to "$previous"
        # otherwise the next timer run would put the newest build straight back
        echo "$previous" > "$PIN"
        echo "pinned; new builds are ignored until pull.sh --force"
        exit 0
fi
if [ "${1:-}" = "--force" ]
then
        rm -f "$PIN"
elif [ -f "$PIN" ]
then
        exit 0
fi

remote="$(curl -fsSL --retry 3 "$BASE/VERSION" | tr -d '[:space:]')"
[[ "$remote" =~ ^[0-9a-f]{40}$ ]] || die "unexpected VERSION: '$remote'"
if [ "$remote" = "$live" ] && [ "${1:-}" != "--force" ]
then
        exit 0
fi

incoming="$(mktemp -d "$ROOT/.incoming.XXXXXX")"
trap 'rm -rf "$incoming"' EXIT
curl -fsSL --retry 3 -o "$incoming/site.tar.gz" "$BASE/site.tar.gz"
curl -fsSL --retry 3 -o "$incoming/site.tar.gz.sha256" "$BASE/site.tar.gz.sha256"
(cd "$incoming" && sha256sum --quiet -c site.tar.gz.sha256) || die "checksum mismatch"
mkdir "$incoming/release"
tar -xzf "$incoming/site.tar.gz" -C "$incoming/release" --no-same-owner
# the assets are replaced one by one; if this archive is not the one VERSION names, try again later
[ "$(cat "$incoming/release/VERSION")" = "$remote" ] || die "archive is not $remote yet, retrying next time"
[ -f "$incoming/release/site/index.html" ] && [ -f "$incoming/release/site/.htaccess" ] || die "archive is missing the site"

rm -rf "$ROOT/releases/$remote"
mv "$incoming/release" "$ROOT/releases/$remote"
touch "$ROOT/releases/$remote"
switch_to "$remote"

# keep the newest few for --rollback
ls -1t "$ROOT/releases" | { grep -vx "$remote" || true; } | tail -n +"$KEEP" | while read -r old
do
        rm -rf "${ROOT:?}/releases/$old"
done
