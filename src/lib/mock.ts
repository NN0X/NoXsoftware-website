// Stand-ins until the WebAssembly builds of Cicero and Brutus land (phase 2).
const VOCAB = ["token", "izer", "split", "review", "sub", "word", "the", "into", "great", "product", "would", "buy", "again", "s", "ing", "ed", "er", "in", "th", "re", "un", "on", "ize", "an", "at", "ly", "ag", "ain"];

export function mockTokenize(text: string): string[]
{
        const out: string[] = [];
        text.toLowerCase().replace(/[0-9\p{P}\p{S}]/gu, "").split(/\s+/).filter(Boolean).forEach((word, wi) =>
        {
                let i = 0;
                let first = true;
                while (i < word.length)
                {
                        let match = word[i] ?? "";
                        for (const v of VOCAB)
                        {
                                if (word.startsWith(v, i) && v.length > match.length)
                                {
                                        match = v;
                                }
                        }
                        out.push((first && wi > 0 ? "▁" : "") + match);
                        first = false;
                        i += match.length;
                }
        });
        return out;
}

const CHARSET = " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~";

export function mockEncrypt(text: string, key: string): string
{
        const k = key || " ";
        let out = "";
        for (let i = 0; i < text.length; i++)
        {
                const a = CHARSET.indexOf(text[i] ?? "");
                const shift = CHARSET.indexOf(k[i % k.length] ?? " ") + i * 7;
                out += a < 0 ? text[i] : CHARSET[(a + shift) % CHARSET.length];
        }
        return out;
}
