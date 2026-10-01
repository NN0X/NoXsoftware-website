// Runs the committed WebAssembly builds in Node and compares them with the native CLIs, built with
// clang++ from the same pinned commits:
//      ./brutus "<text>" "<key>"       ./cicero -i "<text>" "dictionaries/2^16.tok"
//
// Brutus caveat: genPseudouniqueInteger casts out-of-range doubles to unsigned long long, which is
// undefined behaviour. ARM (the Raspberry Pi that served the old site) and WebAssembly saturate;
// x86-64 does not, so an x86 build prints different ciphertexts. The expected values below are the
// ARM/saturating ones, i.e. what the old site produced.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { allowedCharacters, safeText } from "../src/lib/cicero";

interface Module
{
        ccall: (name: string, ret: string, types: string[], args: unknown[]) => unknown;
        FS: { writeFile: (path: string, data: string) => void };
}

const load = async (file: string): Promise<Module> =>
{
        const factory = (await import("../public/wasm/" + file)) as { default: () => Promise<Module> };
        return factory.default();
};

describe("brutus.wasm", () =>
{
        const cases: [string, string, string][] = [
                ["Brutus should not be trusted", "et tu", "##%+ODS9%waf--HQ?=+-7HeQ:#ya"],
                ["Hello, World!", "abc", ")dRaS4Bq\\gYQD"],
                ["the quick brown fox", "password123", "Gnp&#$>%+ _Q>MhAh'3"],
                ["C/C++ rules!!!", "longerkey!", "H7,o&aZW'II\\+4"]
        ];
        it.each(cases)("encrypts %j with key %j exactly like the native ARM build", async (text, key, expected) =>
        {
                const mod = await load("brutus.mjs");
                expect(mod.ccall("brutusText", "string", ["string", "string"], [text, key])).toBe(expected);
        });
});

describe("cicero.wasm", () =>
{
        const dict = readFileSync(new URL("../public/wasm/cicero-2_16.tok", import.meta.url), "utf8");
        const cases: [string, string][] = [
                ["great product would buy again", "48480 36936 35723 23378 38441"],
                ["the tokenizer splits reviews into subwords", "33346 30659 29357 30210 17865 44593 30965 45409 31058 18992"],
                ["great, product", "48480 36970 36936"],
                ["Great Product", "20136 59039"]
        ];
        it.each(cases)("tokenizes %j exactly like the native build", async (text, expected) =>
        {
                const mod = await load("cicero.mjs");
                mod.FS.writeFile("/2^16.tok", dict);
                expect(mod.ccall("ciceroLoad", "number", ["string"], ["/2^16.tok"])).toBe(65536);
                expect((mod.ccall("ciceroTokenize", "string", ["string"], [text]) as string).trim()).toBe(expected);
        });
        it("never gets input that would make it loop forever", () =>
        {
                // the native build hangs on "great 5" and "zażółć"; the filter removes the culprits
                const allowed = allowedCharacters(dict);
                expect(safeText("great 5", allowed).text).toBe("great");
                expect(safeText("zażółć", allowed).text).toBe("za");
        });
});
