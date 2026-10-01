const ENTITIES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" };

export function esc(value: unknown): string
{
        return String(value).replace(/[&<>"']/g, (c) => ENTITIES[c] ?? c);
}
