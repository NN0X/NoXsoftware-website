// Cicero loops forever on characters its dictionary has no single-character token for
// (digits, "-", "'", any non-ASCII letter). The old site stripped digits and punctuation for the
// same reason. This keeps exactly the characters the loaded dictionary can always fall back to.
export function allowedCharacters(dictionary: string): Set<string>
{
        return new Set(dictionary.split("\n").filter((token) => [...token].length === 1));
}

export function safeText(text: string, allowed: Set<string>): { text: string; dropped: string[] }
{
        const dropped = new Set<string>();
        let out = "";
        for (const c of text)
        {
                if (allowed.has(c))
                {
                        out += c;
                }
                else
                {
                        dropped.add(c);
                }
        }
        return { text: out.replace(/ {2,}/g, " ").trim(), dropped: [...dropped] };
}

export const CICERO_MAX_INPUT = 400;
export const BRUTUS_MIN_KEY = 3;
export const BRUTUS_MAX_INPUT = 400;
