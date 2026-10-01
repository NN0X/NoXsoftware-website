// WebAssembly entry points for Cicero. The library itself is compiled unmodified
// from NN0X/CiceroTokenizer at the commit pinned in scripts/build-wasm.sh.
#include <cstdint>
#include <sstream>
#include <string>
#include <vector>

#include <emscripten/emscripten.h>

#include "tokenizer.h"

static TokenDictionary dictionary;
static std::string result;

extern "C"
{
        // Loads a dictionary the page has written into the virtual filesystem. Returns its size.
        EMSCRIPTEN_KEEPALIVE int ciceroLoad(const char* path)
        {
                dictionary = loadTokenDictionary(path);
                return static_cast<int>(dictionary.tokenToIndex.size());
        }

        // Space-separated token ids, exactly what `cicero -i <text>` prints.
        EMSCRIPTEN_KEEPALIVE const char* ciceroTokenize(const char* text)
        {
                std::vector<uint16_t> tokens = tokenizeString(text, dictionary);
                std::ostringstream out;
                for (uint16_t token : tokens)
                {
                        out << token << " ";
                }
                result = out.str();
                return result.c_str();
        }

        EMSCRIPTEN_KEEPALIVE const char* ciceroToken(int id)
        {
                auto it = dictionary.indexToToken.find(static_cast<uint16_t>(id));
                result = it == dictionary.indexToToken.end() ? "" : it->second;
                return result.c_str();
        }
}
