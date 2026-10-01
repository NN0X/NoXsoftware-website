import { describe, expect, it } from "vitest";
import { lev } from "../src/lib/lev";
import { monthRange, activityChart } from "../src/lib/activity";
import { highlight } from "../src/lib/highlight";
import { esc } from "../src/lib/esc";
import { normalizeUrl } from "../src/lib/url";
import { allowedCharacters, safeText } from "../src/lib/cicero";

describe("lev", () =>
{
        it("counts a transposition as one edit, so zsh offers git for gti", () =>
        {
                expect(lev("gti", "git")).toBe(1);
        });
        it("is a normal edit distance otherwise", () =>
        {
                expect(lev("kitten", "sitting")).toBe(3);
                expect(lev("", "abc")).toBe(3);
                expect(lev("same", "same")).toBe(0);
        });
});

describe("monthRange", () =>
{
        it("ends at the month of the given date and crosses year boundaries", () =>
        {
                const months = monthRange("2026-02-15", 4);
                expect(months).toEqual(["2025-11", "2025-12", "2026-01", "2026-02"]);
        });
});

describe("activityChart", () =>
{
        it("labels only the busiest month and marks active ones", () =>
        {
                const html = activityChart({ "2026-01": 2, "2026-02": 9 }, ["2026-01", "2026-02"], "commits");
                expect(html.match(/class="on"/g)).toHaveLength(2);
                expect(html).toContain("<b>9</b>");
                expect(html).not.toContain("<b>2</b>");
        });
});

describe("highlight", () =>
{
        it("escapes code and marks keywords, strings and comments", () =>
        {
                const [line] = highlight("return \"<a>\"; // done", "cpp");
                expect(line).toContain("<span class=\"s-kw\">return</span>");
                expect(line).toContain("&lt;a&gt;");
                expect(line).toContain("s-com");
        });
        it("treats # as a comment in Python and as a directive in C", () =>
        {
                expect(highlight("# note", "py")[0]).toContain("s-com");
                expect(highlight("#include <x>", "c")[0]).toContain("s-mac");
        });
});

describe("esc", () =>
{
        it("escapes everything that matters inside HTML and attributes", () =>
        {
                expect(esc("<b a=\"1\">'&'</b>")).toBe("&lt;b a=&quot;1&quot;&gt;&#39;&amp;&#39;&lt;/b&gt;");
        });
});

describe("normalizeUrl", () =>
{
        it("turns typed input into what Firefox would load", () =>
        {
                expect(normalizeUrl("")).toBe("about:newtab");
                expect(normalizeUrl("About:Robots")).toBe("about:robots");
                expect(normalizeUrl("noxsoftware.pl/projects/tdc2")).toBe("https://noxsoftware.pl/projects/tdc2");
                expect(normalizeUrl("http://example.com")).toBe("https://example.com");
                expect(normalizeUrl("logic simulator")).toBe("about:search?q=logic%20simulator");
        });
});

describe("cicero input filter", () =>
{
        const allowed = allowedCharacters("a\nb\n \n,\nab\nlonger");
        it("collects the single-character tokens of a dictionary", () =>
        {
                expect([...allowed].sort()).toEqual([" ", ",", "a", "b"]);
        });
        it("keeps only characters Cicero can always fall back to and reports the rest", () =>
        {
                expect(safeText("ab, 5 łb", allowed)).toEqual({ text: "ab, b", dropped: ["5", "ł"] });
        });
});
