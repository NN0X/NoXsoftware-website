// Fills the XRating section of the plain /projects/f1ratings/ page from /data/f1.json.
import type { Lang } from "../data/types";
import { translate, type StringKey } from "../lib/i18n";
import { esc } from "../lib/esc";
import { chartSvg, f1Rows, type F1Data, type F1Set, type F1Sort, type F1View } from "../lib/f1";
import { F1Missing, loadF1 } from "./f1load";

function mount(root: HTMLElement): void
{
        const lang: Lang = root.dataset.lang === "pl" ? "pl" : "en";
        const t = (key: StringKey, vars?: Record<string, string | number>): string => translate(lang, key, vars);
        const found = root.querySelector<HTMLDivElement>("[data-f1-out]");
        if (!found)
        {
                return;
        }
        const out: HTMLDivElement = found;
        let set: F1Set = "drivers";
        let view: F1View = "grid";
        let sort: F1Sort = "now";
        let ascending = false;
        let picked: string | null = null;

        function draw(data: F1Data): void
        {
                const list = data[set];
                const rows = f1Rows(list, view, sort, ascending);
                const toggle = (attr: string, value: string, label: string, on: boolean): string =>
                        "<button type=\"button\" data-" + attr + "=\"" + value + "\" aria-pressed=\"" + on + "\">" + esc(label) + "</button>";
                const header = (label: string, key: F1Sort | null): string =>
                {
                        if (!key)
                        {
                                return "<th>" + esc(label) + "</th>";
                        }
                        const state = key === sort ? " aria-sort=\"" + (ascending ? "ascending" : "descending") + "\"" : "";
                        return "<th" + state + "><button type=\"button\" data-sort=\"" + key + "\">" + esc(label) + "</button></th>";
                };
                const picks = list.find((e) => e.name === picked);
                out.innerHTML = "<p class=\"muted\">" + esc(data.lastRace ? t("f1.lastRace", { r: data.lastRace.name, d: data.lastRace.date }) + " · " : "") + esc(t("f1.generated", { d: data.generated.slice(0, 10) }))
                        + " <a href=\"https://github.com/" + esc(data.source.repo) + "\">" + esc(data.source.repo) + "</a></p>"
                        + (data.fixture ? "<p class=\"y\">" + esc(t("f1.sample").replace(/^# /, "")) + "</p>" : "")
                        + "<div class=\"xr-tabs\">" + toggle("set", "drivers", t("f1.drivers"), set === "drivers") + toggle("set", "teams", t("f1.teams"), set === "teams")
                        + "<span></span>" + toggle("view", "grid", t("f1.grid"), view === "grid") + toggle("view", "all", t("f1.all"), view === "all") + "</div>"
                        + "<div class=\"table-wrap\"><table class=\"repos xr-table\"><thead><tr>" + header("#", null) + header(t(set === "drivers" ? "f1.driver" : "f1.team"), "name")
                        + header(t("f1.now"), "now") + header(t("f1.peak"), "peak") + header("Δ", "delta") + "</tr></thead><tbody>"
                        + rows.map((e, i) => "<tr" + (e.name === picked ? " class=\"on\"" : "") + "><td class=\"num\">" + (i + 1) + "</td><td><button type=\"button\" class=\"link\" data-pick=\"" + esc(e.name) + "\">" + esc(e.name) + "</button></td>"
                                + "<td class=\"num\"><b>" + e.current + "</b></td><td class=\"num\">" + e.peak + " <span class=\"f\">" + esc(e.peakDate?.slice(0, 4) ?? "") + "</span></td>"
                                + "<td class=\"num " + (e.change === null || e.change === 0 ? "" : e.change < 0 ? "r" : "g") + "\">" + (e.change === null ? "" : (e.change > 0 ? "+" : "") + e.change.toFixed(1)) + "</td></tr>").join("")
                        + "</tbody></table></div>"
                        + (picks ? "<h3>" + esc(picks.name) + "</h3><p class=\"muted\">" + esc(t("f1.history", { n: picks.current, p: picks.peak, d: picks.peakDate ?? "N/A" })) + "</p>" + chartSvg(picks, t("f1.noHistory")) : "<p class=\"muted\">" + esc(t("f1.pick")) + "</p>");
        }

        loadF1().then((data) =>
        {
                draw(data);
                out.addEventListener("click", (e) =>
                {
                        const b = (e.target as HTMLElement).closest<HTMLButtonElement>("button");
                        if (!b)
                        {
                                return;
                        }
                        const d = b.dataset;
                        if (d.set)
                        {
                                set = d.set as F1Set;
                                picked = null;
                        }
                        else if (d.view)
                        {
                                view = d.view as F1View;
                        }
                        else if (d.sort)
                        {
                                ascending = d.sort === sort ? !ascending : d.sort === "name";
                                sort = d.sort as F1Sort;
                        }
                        else if (d.pick)
                        {
                                picked = picked === d.pick ? null : d.pick;
                        }
                        draw(data);
                        // keep keyboard focus on the control that was just used
                        const key = Object.entries(d)[0];
                        if (key)
                        {
                                out.querySelector<HTMLButtonElement>("button[data-" + key[0] + "=\"" + CSS.escape(key[1] ?? "") + "\"]")?.focus();
                        }
                });
        }).catch((err: unknown) =>
        {
                out.innerHTML = err instanceof F1Missing
                        ? "<p class=\"muted\">" + esc(t("f1.missing")) + "</p>"
                        : "<p class=\"r\">" + esc(t("f1.failed", { e: err instanceof Error ? err.message : String(err) })) + "</p>";
        });
}

for (const root of document.querySelectorAll<HTMLElement>("[data-f1]"))
{
        mount(root);
}
