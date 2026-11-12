// Fetches /data/f1.json once per page. Shared by the desktop and the plain F1Ratings page.
import { F1_URL, isF1Data, type F1Data } from "../lib/f1";

// The file is produced on the server by a timer (server/README.md); until its first run there is nothing to fetch.
export class F1Missing extends Error
{
}

let pending: Promise<F1Data> | null = null;

export function loadF1(): Promise<F1Data>
{
        if (!pending)
        {
                pending = fetch(F1_URL, { cache: "no-cache" }).then(async (r) =>
                {
                        if (r.status === 404)
                        {
                                throw new F1Missing(F1_URL + " not found");
                        }
                        if (!r.ok)
                        {
                                throw new Error("HTTP " + r.status);
                        }
                        const data: unknown = await r.json();
                        if (!isF1Data(data))
                        {
                                throw new Error("unexpected format");
                        }
                        return data;
                });
                // a failed load may succeed later (the timer ran, the network came back)
                pending.catch(() =>
                {
                        pending = null;
                });
        }
        return pending;
}
