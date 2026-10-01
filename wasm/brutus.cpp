// WebAssembly entry points for Brutus. The library itself is compiled unmodified
// from NN0X/Brutus-Encryption at the commit pinned in scripts/build-wasm.sh.
#include <string>

#include <emscripten/emscripten.h>

#include "brutus.h"

static std::string result;

extern "C"
{
        EMSCRIPTEN_KEEPALIVE const char* brutusText(const char* text, const char* key)
        {
                result = Brutus::text(text, key);
                return result.c_str();
        }
}
