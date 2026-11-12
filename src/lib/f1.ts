// The F1Ratings export (server/f1/export.py) and helpers to show it. Pure, so it can be tested.
import { esc } from "./esc";

export interface F1Entry
{
        name: string;
        current: number;
        peak: number;
        peakDate: string | null;
        change: number | null;
        changeDate: string | null;
        onGrid: boolean;
        history?: [string, number][];
}

export interface F1Data
{
        generated: string;
        source: { repo: string; commit: string | null; dataset: string };
        fixture: boolean;
        lastRace: { name: string; date: string } | null;
        drivers: F1Entry[];
        teams: F1Entry[];
}

export type F1View = "grid" | "all";
export type F1Sort = "name" | "peak" | "now" | "delta";
export type F1Set = "drivers" | "teams";

// What `f1ratings [--teams] [--all-time] [--sort ...] [plot <name>]` asks the f1 window to show.
export interface F1Options
{
        set?: F1Set;
        view?: F1View;
        sort?: F1Sort;
        ascending?: boolean;
        pick?: string;
}

export const F1_URL = "/data/f1.json";

export function isF1Data(x: unknown): x is F1Data
{
        const d = x as F1Data | null;
        return typeof d === "object" && d !== null && Array.isArray(d.drivers) && Array.isArray(d.teams) && typeof d.generated === "string";
}

export function f1Rows(list: F1Entry[], view: F1View, sort: F1Sort, ascending: boolean, query = ""): F1Entry[]
{
        const q = query.trim().toLowerCase();
        const key = (e: F1Entry): number | string =>
        {
                switch (sort)
                {
                        case "name":
                                return e.name.toLowerCase();
                        case "peak":
                                return e.peak;
                        case "delta":
                                return e.change ?? 0;
                        default:
                                return e.current;
                }
        };
        return list
                .filter((e) => (view === "all" || e.onGrid) && (!q || e.name.toLowerCase().includes(q)))
                .sort((a, b) =>
                {
                        const x = key(a);
                        const y = key(b);
                        const d = typeof x === "string" ? x.localeCompare(y as string) : x - (y as number);
                        return ascending ? d : -d;
                });
}

// The same line Driver.__str__ / Team.__str__ print in F1Ratings.
export function cliLine(e: F1Entry): string
{
        return e.name.padEnd(40) + " | " + String(e.current).padStart(5) + " Peak: " + String(e.peak).padStart(5) + " " + (e.peakDate ?? "N/A");
}

// `python main.py print`: the grid from worst to best, numbered down to 1 so the leader ends up next to the prompt.
export function gridLines(list: F1Entry[]): string[]
{
        const grid = list.filter((e) => e.onGrid).sort((a, b) => a.current - b.current);
        return grid.map((e, i) => String(grid.length - i).padStart(2) + ". " + cliLine(e));
}

// `python main.py change <name>`
export function changeLine(e: F1Entry): string
{
        const change = e.change === null ? "N/A" : (e.change >= 0 ? "+" : "") + e.change.toFixed(2);
        return "Last change for " + e.name + ": " + change + " on " + (e.changeDate ?? "N/A");
}

export function findEntry(list: F1Entry[], name: string): F1Entry | undefined
{
        const q = name.trim().toLowerCase();
        if (!q)
        {
                return undefined;
        }
        return list.find((e) => e.name.toLowerCase() === q) ?? list.find((e) => e.name.toLowerCase().split(" ").includes(q)) ?? list.find((e) => e.name.toLowerCase().includes(q));
}

export interface ChartGeometry
{
        line: string;
        min: number;
        max: number;
        peak: [number, number];
        years: [number, string][];
}

// An SVG polyline for a rating history, scaled into width x height, with a tick per decade (or year).
export function chartGeometry(history: [string, number][], width: number, height: number): ChartGeometry | null
{
        if (history.length < 2)
        {
                return null;
        }
        const times = history.map(([d]) => Date.parse(d));
        const values = history.map(([, v]) => v);
        const t0 = Math.min(...times);
        const t1 = Math.max(...times);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const x = (t: number): number => (t1 === t0 ? 0 : (t - t0) / (t1 - t0) * width);
        const y = (v: number): number => (max === min ? height / 2 : height - (v - min) / (max - min) * height);
        const line = history.map(([, v], i) => x(times[i]!).toFixed(1) + "," + y(v).toFixed(1)).join(" ");
        const peakIndex = values.indexOf(max);
        const firstYear = new Date(t0).getUTCFullYear();
        const lastYear = new Date(t1).getUTCFullYear();
        const step = lastYear - firstYear > 20 ? 10 : lastYear - firstYear > 6 ? 2 : 1;
        const years: [number, string][] = [];
        for (let year = Math.ceil(firstYear / step) * step; year <= lastYear; year += step)
        {
                const t = Date.UTC(year, 0, 1);
                if (t >= t0)
                {
                        years.push([x(t), String(year)]);
                }
        }
        return { line, min, max, peak: [x(times[peakIndex]!), y(max)], years };
}

const CHART_W = 640;
const CHART_H = 120;

// The rating history as an inline SVG (styled by .xr in base.css), or a note when none was exported.
export function chartSvg(e: F1Entry, noHistory: string): string
{
        const g = e.history ? chartGeometry(e.history, CHART_W, CHART_H) : null;
        if (!g)
        {
                return "<p class=\"f\">" + esc(noHistory) + "</p>";
        }
        const ticks = g.years.map(([x, label]) => "<line x1=\"" + x.toFixed(1) + "\" y1=\"0\" x2=\"" + x.toFixed(1) + "\" y2=\"" + CHART_H + "\" class=\"grid\"/><text x=\"" + x.toFixed(1) + "\" y=\"" + (CHART_H + 16) + "\">" + label + "</text>").join("");
        return "<svg class=\"xr\" viewBox=\"-46 -8 " + (CHART_W + 54) + " " + (CHART_H + 30) + "\" role=\"img\" aria-label=\"" + esc(e.name + ": " + g.min + "–" + g.max) + "\">"
                + ticks
                + "<text x=\"-6\" y=\"4\" class=\"v\">" + g.max + "</text><text x=\"-6\" y=\"" + CHART_H + "\" class=\"v\">" + g.min + "</text>"
                + "<polyline points=\"" + g.line + "\"/>"
                + "<circle cx=\"" + g.peak[0].toFixed(1) + "\" cy=\"" + g.peak[1].toFixed(1) + "\" r=\"3.5\"/>"
                + "</svg>";
}
