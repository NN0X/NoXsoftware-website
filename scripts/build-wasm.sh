#!/usr/bin/env bash
# Compiles Brutus and Cicero to WebAssembly for the in-browser demos.
#
#       source /path/to/emsdk/emsdk_env.sh
#       npm run wasm
#
# The C++ is fetched unmodified at the pinned commits below; only the small bindings in wasm/ live
# here. Output goes to public/wasm/ and is committed, so building the site does not need Emscripten.
# Bump a pin, rerun, and run `npm test`: tests/wasm.test.ts checks the output against the native CLI.
set -euo pipefail

BRUTUS_COMMIT=1ab867175323e129bad52b6b6f31e1824c84e3e3
CICERO_COMMIT=2a9136762f86759e9d6e9211f0b72335202ac2d0

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CACHE="$ROOT/.cache/wasm-src"
OUT="$ROOT/public/wasm"

fetch()
{
        local name="$1" commit="$2"
        local dir="$CACHE/$name"
        if [ ! -d "$dir/.git" ]
        then
                git clone --quiet "https://github.com/NN0X/$name.git" "$dir"
        fi
        git -C "$dir" fetch --quiet origin
        git -C "$dir" -c advice.detachedHead=false checkout --quiet "$commit"
        echo "$dir"
}

command -v em++ > /dev/null || { echo "em++ not found: source emsdk_env.sh first" >&2; exit 1; }
mkdir -p "$CACHE" "$OUT"

COMMON=(-O3 -sMODULARIZE=1 -sEXPORT_ES6=1 -sENVIRONMENT=web,node -sALLOW_MEMORY_GROWTH=1 -sFILESYSTEM=1
        "-sEXPORTED_RUNTIME_METHODS=['ccall','cwrap','FS','UTF8ToString']")

BRUTUS="$(fetch Brutus-Encryption "$BRUTUS_COMMIT")"
em++ "${COMMON[@]}" -std=c++11 -I"$BRUTUS/src" \
        $(ls "$BRUTUS"/src/*.cpp | grep -v '/main.cpp$') "$ROOT/wasm/brutus.cpp" \
        --embed-file "$BRUTUS/charset.txt@charset.txt" \
        -sEXPORT_NAME=createBrutus "-sEXPORTED_FUNCTIONS=['_brutusText']" \
        -o "$OUT/brutus.mjs"

CICERO="$(fetch CiceroTokenizer "$CICERO_COMMIT")"
em++ "${COMMON[@]}" -std=c++17 -I"$CICERO/src" \
        "$CICERO/src/tokenizer.cpp" "$ROOT/wasm/cicero.cpp" \
        -sEXPORT_NAME=createCicero "-sEXPORTED_FUNCTIONS=['_ciceroLoad','_ciceroTokenize','_ciceroToken']" \
        -o "$OUT/cicero.mjs"
cp "$CICERO/dictionaries/2^16.tok" "$OUT/cicero-2_16.tok"

ls -la "$OUT"
