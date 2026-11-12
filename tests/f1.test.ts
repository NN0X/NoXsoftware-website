import { describe, expect, it } from "vitest";
import { changeLine, chartGeometry, chartSvg, cliLine, f1Rows, findEntry, gridLines, isF1Data, type F1Entry } from "../src/lib/f1";

function entry(name: string, current: number, extra: Partial<F1Entry> = {}): F1Entry
{
        return { name, current, peak: current + 100, peakDate: "1957-08-04", change: 1.5, changeDate: "2026-07-26", onGrid: true, ...extra };
}

const LIST = [
        entry("Juan Manuel Fangio", 5120, { onGrid: false, change: null }),
        entry("Max Verstappen", 4810, { change: -12.34 }),
        entry("Lewis Hamilton", 4390, { change: 3 }),
        entry("Oscar Piastri", 3020, { change: 0 })
];

describe("f1Rows", () =>
{
        it("shows only the current grid unless asked for all time", () =>
        {
                expect(f1Rows(LIST, "grid", "now", false).map((e) => e.name)).toEqual(["Max Verstappen", "Lewis Hamilton", "Oscar Piastri"]);
                expect(f1Rows(LIST, "all", "now", false)[0]?.name).toBe("Juan Manuel Fangio");
        });

        it("sorts by name, delta and direction, and filters by a search", () =>
        {
                expect(f1Rows(LIST, "grid", "name", true).map((e) => e.name)).toEqual(["Lewis Hamilton", "Max Verstappen", "Oscar Piastri"]);
                expect(f1Rows(LIST, "grid", "delta", true)[0]?.name).toBe("Max Verstappen");
                expect(f1Rows(LIST, "all", "now", false, "  HAM ").map((e) => e.name)).toEqual(["Lewis Hamilton"]);
        });

        it("does not reorder the list it was given", () =>
        {
                f1Rows(LIST, "all", "name", true);
                expect(LIST[0]?.name).toBe("Juan Manuel Fangio");
        });
});

describe("CLI parity with F1Ratings main.py", () =>
{
        it("prints a rating line like Driver.__str__", () =>
        {
                expect(cliLine(entry("Max Verstappen", 4810, { peak: 4990, peakDate: "2023-11-26" })))
                        .toBe("Max Verstappen                           |  4810 Peak:  4990 2023-11-26");
                expect(cliLine(entry("Nobody", 1200, { peak: 1200, peakDate: null }))).toMatch(/ N\/A$/);
        });

        it("prints the grid worst first, numbered down to the leader", () =>
        {
                const lines = gridLines(LIST);
                expect(lines).toHaveLength(3);
                expect(lines[0]).toMatch(/^ 3\. Oscar Piastri/);
                expect(lines[2]).toMatch(/^ 1\. Max Verstappen/);
        });

        it("prints the last change with a sign and two decimals", () =>
        {
                expect(changeLine(LIST[1]!)).toBe("Last change for Max Verstappen: -12.34 on 2026-07-26");
                expect(changeLine(LIST[2]!)).toBe("Last change for Lewis Hamilton: +3.00 on 2026-07-26");
                expect(changeLine(LIST[0]!)).toBe("Last change for Juan Manuel Fangio: N/A on 2026-07-26");
        });
});

describe("findEntry", () =>
{
        it("matches a full name, a single name, then a fragment", () =>
        {
                expect(findEntry(LIST, "max verstappen")?.name).toBe("Max Verstappen");
                expect(findEntry(LIST, "Fangio")?.name).toBe("Juan Manuel Fangio");
                expect(findEntry(LIST, "piast")?.name).toBe("Oscar Piastri");
                expect(findEntry(LIST, "  ")).toBeUndefined();
                expect(findEntry(LIST, "Senna")).toBeUndefined();
        });
});

describe("chart", () =>
{
        const history: [string, number][] = [["1950-05-13", 1200], ["1957-08-04", 2000], ["1958-12-31", 1600]];

        it("scales a history into the box and marks the peak", () =>
        {
                const g = chartGeometry(history, 100, 50)!;
                expect(g.min).toBe(1200);
                expect(g.max).toBe(2000);
                expect(g.line.split(" ")[0]).toBe("0.0,50.0");
                expect(g.line.split(" ")[2]).toBe("100.0,25.0");
                expect(g.peak[1]).toBe(0);
                expect(g.years.map(([, y]) => y)).toEqual(["1952", "1954", "1956", "1958"]);
        });

        it("needs two points, and says so instead of drawing", () =>
        {
                expect(chartGeometry([["2026-01-01", 1200]], 100, 50)).toBeNull();
                expect(chartSvg(entry("<b>New</b>", 1200), "no history")).toBe("<p class=\"f\">no history</p>");
                expect(chartSvg(entry("<b>New</b>", 1200, { history }), "")).toContain("aria-label=\"&lt;b&gt;New&lt;/b&gt;: 1200–2000\"");
        });
});

describe("isF1Data", () =>
{
        it("accepts the export shape and rejects anything else", () =>
        {
                expect(isF1Data({ generated: "2026-11-12T00:00:00+00:00", drivers: [], teams: [] })).toBe(true);
                expect(isF1Data({ drivers: [] })).toBe(false);
                expect(isF1Data(null)).toBe(false);
                expect(isF1Data("<!doctype html>")).toBe(false);
        });
});
