#!/usr/bin/env bash
# Re-encodes the easter-egg media from the old site (kept on the `legacy` branch) into public/media/.
# The output is committed; run this only to change the encoding. Needs ffmpeg with libx264 and libwebp.
#
# Videos: one 720p (540p for the five-minute one) H.264 + AAC MP4 each, which every browser plays,
# instead of the old mix of AV1, VP9 and H.264 at 1080p. 73 MB → 18 MB.
# GIFs: the transparent ("wb") variants as animated WebP, which keeps the transparency. 4.4 MB → 0.7 MB.
set -euo pipefail

REF="${1:-origin/legacy}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/public/media"
SRC="$(mktemp -d)"
trap 'rm -rf "$SRC"' EXIT
mkdir -p "$OUT/eggs"

take()
{
        git -C "$ROOT" show "$REF:src/resources/$1" > "$SRC/$(basename "$1")"
}

# name, source, crf, max height
video()
{
        take "videos/$2"
        ffmpeg -v error -y -i "$SRC/$2" -vf "scale=-2:'min($4,ih)'" \
                -c:v libx264 -preset slower -crf "$3" -profile:v high -pix_fmt yuv420p \
                -c:a aac -b:a 80k -ac 2 -movflags +faststart "$OUT/eggs/$1.mp4"
        ffmpeg -v error -y -ss 1 -i "$OUT/eggs/$1.mp4" -frames:v 1 -vf scale=640:-2 -c:v libwebp -q:v 60 "$OUT/eggs/$1.webp"
}

gif()
{
        take "images/$2"
        ffmpeg -v error -y -i "$SRC/$2" -c:v libwebp_anim -lossless 0 -q:v 70 -loop 0 -an "$OUT/$1.webp"
}

video c programinc.webm 32 720
video cpp c++slander.webm 32 720
video linux linuxusers.mp4 32 720
video python pythondeveloper.webm 33 540
gif where pulp-fiction-where-wb.gif
gif noooo noooo_wb.gif
du -sh "$OUT"
