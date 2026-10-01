// The real Brutus and Cicero, compiled from C++ to WebAssembly (see scripts/build-wasm.sh).
import { BRUTUS_MAX_INPUT, CICERO_MAX_INPUT } from "../../lib/cicero";

interface BrutusModule
{
        ccall: (name: string, ret: string, types: string[], args: unknown[]) => unknown;
}

export interface Tokens
{
        ids: number[];
        pieces: string[];
        dropped: string[];
        size: number;
}

const CICERO_TIMEOUT = 4000;

let brutus: Promise<(text: string, key: string) => string> | null = null;

export function loadBrutus(): Promise<(text: string, key: string) => string>
{
        brutus ??= (async () =>
        {
                const factory = (await import(/* @vite-ignore */ location.origin + "/wasm/brutus.mjs")) as { default: () => Promise<BrutusModule> };
                const mod = await factory.default();
                return (text: string, key: string): string => mod.ccall("brutusText", "string", ["string", "string"], [text.slice(0, BRUTUS_MAX_INPUT), key]) as string;
        })();
        brutus.catch(() =>
        {
                brutus = null;
        });
        return brutus;
}

let worker: Worker | null = null;
let seq = 0;
const waiting = new Map<number, { resolve: (t: Tokens) => void; reject: (e: Error) => void; timer: ReturnType<typeof setTimeout> }>();

function ciceroWorker(): Worker
{
        if (worker)
        {
                return worker;
        }
        worker = new Worker(new URL("./cicero.worker.ts", import.meta.url), { type: "module" });
        worker.addEventListener("message", (e: MessageEvent<{ id: number; ok: boolean; error?: string } & Tokens>) =>
        {
                const job = waiting.get(e.data.id);
                if (!job)
                {
                        return;
                }
                clearTimeout(job.timer);
                waiting.delete(e.data.id);
                if (e.data.ok)
                {
                        job.resolve({ ids: e.data.ids, pieces: e.data.pieces, dropped: e.data.dropped, size: e.data.size });
                }
                else
                {
                        job.reject(new Error(e.data.error ?? "cicero failed"));
                }
        });
        return worker;
}

export function tokenize(text: string): Promise<Tokens>
{
        const w = ciceroWorker();
        const id = ++seq;
        return new Promise((resolve, reject) =>
        {
                // the first call also downloads the module and the 380 KB dictionary, so be generous
                const timer = setTimeout(() =>
                {
                        waiting.delete(id);
                        worker?.terminate();
                        worker = null;
                        reject(new Error("cicero timed out"));
                }, CICERO_TIMEOUT + (seq === 1 ? 8000 : 0));
                waiting.set(id, { resolve, reject, timer });
                w.postMessage({ id, text: text.slice(0, CICERO_MAX_INPUT) });
        });
}
