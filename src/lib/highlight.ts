import { esc } from "./esc";

// A deliberately small highlighter: enough for short excerpts, same output on the server and in the browser.
const KEYWORDS: Record<string, string[]> = {
        c: ["void", "bool", "int", "char", "const", "return", "if", "else", "for", "while", "struct", "static", "unsigned", "sizeof", "true", "false", "uint32_t", "uint64_t", "size_t"],
        cpp: ["void", "bool", "int", "char", "const", "return", "if", "else", "for", "while", "struct", "static", "unsigned", "auto", "double", "std", "string", "vector", "true", "false", "nullptr", "size_t", "continue"],
        py: ["def", "return", "if", "else", "elif", "for", "in", "not", "try", "except", "import", "from", "and", "or", "None", "True", "False"],
        php: ["class", "public", "protected", "private", "function", "return", "if", "else", "array", "string", "null", "new", "include"],
        mai: ["entry", "return", "none", "sint64", "sint32", "ascii"]
};

export const LANG_NAMES: Record<string, string> = { c: "c", cpp: "cpp", py: "python", php: "php", mai: "maiora" };

export function highlight(code: string, lang: string): string[]
{
        const keywords = new Set(KEYWORDS[lang] ?? []);
        const re = lang === "py"
                ? /(#.*$)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(\b\d[\w.]*\b)|([A-Za-z_]\w*)/g
                : /(\/\/.*$)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(\b\d[\w.]*\b)|(\$?[A-Za-z_]\w*)/g;
        return code.split("\n").map((line) =>
        {
                if (lang !== "py" && /^\s*#/.test(line))
                {
                        return "<span class=\"s-mac\">" + esc(line) + "</span>";
                }
                let out = "";
                let last = 0;
                let m: RegExpExecArray | null;
                re.lastIndex = 0;
                while ((m = re.exec(line)) !== null)
                {
                        out += esc(line.slice(last, m.index));
                        let cls = "";
                        if (m[1])
                        {
                                cls = "s-com";
                        }
                        else if (m[2])
                        {
                                cls = "s-str";
                        }
                        else if (m[3])
                        {
                                cls = "s-num";
                        }
                        else if (keywords.has(m[4] ?? ""))
                        {
                                cls = "s-kw";
                        }
                        else if (/^\s*\(/.test(line.slice(re.lastIndex)))
                        {
                                cls = "s-fn";
                        }
                        else if (/_t$|^[A-Z][a-z]|^STATE_|^PQLDP_/.test(m[4] ?? ""))
                        {
                                cls = "s-ty";
                        }
                        out += cls ? "<span class=\"" + cls + "\">" + esc(m[0]) + "</span>" : esc(m[0]);
                        last = re.lastIndex;
                }
                return out + esc(line.slice(last));
        });
}
