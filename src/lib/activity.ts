import { esc } from "./esc";

export const MONTH_SPAN = 29;

// The last MONTH_SPAN months up to and including the month of `until` (YYYY-MM-DD).
export function monthRange(until: string, span: number = MONTH_SPAN): string[]
{
        let y = Number(until.slice(0, 4));
        let m = Number(until.slice(5, 7));
        const out: string[] = [];
        for (let i = 0; i < span; i++)
        {
                out.unshift(y + "-" + String(m).padStart(2, "0"));
                m--;
                if (m === 0)
                {
                        m = 12;
                        y--;
                }
        }
        return out;
}

export function activityChart(activity: Record<string, number>, months: string[], label: string): string
{
        const values = months.map((m) => activity[m] ?? 0);
        const max = Math.max(1, ...values);
        let bars = "";
        let ticks = "";
        months.forEach((m, i) =>
        {
                const v = values[i] ?? 0;
                const h = v ? Math.max(10, Math.round(Math.log(v + 1) / Math.log(max + 1) * 100)) : 3;
                bars += "<i class=\"" + (v ? "on" : "") + "\" title=\"" + m + ": " + v + "\" style=\"height:" + h + "%\">" + (v === max && v > 0 ? "<b>" + v + "</b>" : "") + "</i>";
                ticks += "<span>" + (i === 0 ? "'" + m.slice(2, 4) : m.endsWith("-01") ? "'" + m.slice(2, 4) : "") + "</span>";
        });
        return "<div class=\"chart\" style=\"--n:" + months.length + "\" role=\"img\" aria-label=\"" + esc(label) + "\">" + bars + "</div><div class=\"chart-x\" style=\"--n:" + months.length + "\" aria-hidden=\"true\">" + ticks + "</div>";
}
