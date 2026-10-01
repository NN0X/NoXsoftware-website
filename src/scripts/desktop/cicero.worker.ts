// Runs Cicero (C++ compiled to WebAssembly) off the main thread, so a slow or stuck call can be
// killed without freezing the page.
import { allowedCharacters, safeText } from "../../lib/cicero";

interface CiceroModule
{
        ccall: (name: string, ret: string, types: string[], args: unknown[]) => unknown;
        FS: { writeFile: (path: string, data: string) => void };
}

interface Request
{
        id: number;
        text: string;
}

const DICTIONARY = "/2^16.tok";

const ready = (async () =>
{
        const base = self.location.origin;
        const factory = (await import(/* @vite-ignore */ base + "/wasm/cicero.mjs")) as { default: () => Promise<CiceroModule> };
        const [mod, dict] = await Promise.all([factory.default(), fetch(base + "/wasm/cicero-2_16.tok").then((r) => r.text())]);
        mod.FS.writeFile(DICTIONARY, dict);
        const size = mod.ccall("ciceroLoad", "number", ["string"], [DICTIONARY]) as number;
        return { mod, size, allowed: allowedCharacters(dict) };
})();

self.addEventListener("message", async (e: MessageEvent<Request>) =>
{
        try
        {
                const { mod, size, allowed } = await ready;
                const clean = safeText(e.data.text, allowed);
                const raw = clean.text ? mod.ccall("ciceroTokenize", "string", ["string"], [clean.text]) as string : "";
                const ids = raw.trim().split(/\s+/).filter(Boolean).map(Number);
                const pieces = ids.map((id) => mod.ccall("ciceroToken", "string", ["number"], [id]) as string);
                self.postMessage({ id: e.data.id, ok: true, ids, pieces, dropped: clean.dropped, size });
        }
        catch (err)
        {
                self.postMessage({ id: e.data.id, ok: false, error: String(err) });
        }
});
