// htop, where every repository is a process: CPU% is its share of commits, TIME+ its commit count.
import { REPOS, data, el, meta, t, total, type Win } from "../core";
import { kill, openProject, register } from "../wm";
import { esc } from "../../../lib/esc";

type SortKey = "commits" | "last" | "name";

function render(body: HTMLDivElement, w: Win): void
{
        body.classList.add("htop");
        w.title = () => "htop";
        let sortKey: SortKey = "commits";
        const repos = Object.keys(REPOS);
        const all = repos.reduce((a, r) => a + total(r), 0);
        const recent = Date.parse(data.generated) - 30 * 86400000;
        const isRunning = (r: string): boolean => Date.parse(REPOS[r]?.last ?? "") >= recent;
        const running = repos.filter(isRunning).length;

        const byLang: Record<string, number> = {};
        for (const r of repos)
        {
                const lang = REPOS[r]?.lang || "?";
                byLang[lang] = (byLang[lang] ?? 0) + total(r);
        }
        const meters = el("div", "meters");
        for (const [lang, n] of Object.entries(byLang).sort((a, b) => b[1] - a[1]).slice(0, 4))
        {
                const pct = n / all * 100;
                const m = el("div", "meter");
                m.innerHTML = "<span class=\"lab\">" + esc(lang) + "</span><span class=\"f\">[</span><span class=\"bars\"><span class=\"g\">" + "|".repeat(Math.round(pct / 100 * 32)) + "</span></span><span class=\"d\">" + pct.toFixed(1) + "%</span><span class=\"f\">]</span>";
                meters.append(m);
        }
        const sum = el("div", "sum");
        const table = el("table");
        const keys = el("div", "keys");
        body.append(meters, sum, table, keys);
        const columns: [string, SortKey | null][] = [["PID", null], ["USER", null], ["S", null], ["CPU%", "commits"], ["TIME+", "commits"], ["LAST", "last"], ["Command", "name"]];

        function draw(): void
        {
                sum.innerHTML = t("htop.sum", { t: repos.length, r: running, c: all });
                keys.innerHTML = "<span><b>⏎</b>" + esc(t("htop.open")) + "</span><span><b>F6</b>" + esc(t("htop.sort")) + "</span><span><b>S</b>" + esc(t("htop.r")) + "</span><span><b>F10</b>" + esc(t("htop.close")) + "</span>";
                const rows = [...repos].sort((a, b) =>
                {
                        if (sortKey === "last")
                        {
                                return (REPOS[b]?.last ?? "").localeCompare(REPOS[a]?.last ?? "");
                        }
                        if (sortKey === "name")
                        {
                                return a.localeCompare(b);
                        }
                        return total(b) - total(a);
                });
                const head = el("tr");
                for (const [label, key] of columns)
                {
                        const th = el("th", key && key === sortKey && label !== "CPU%" ? "on" : "", label);
                        if (key)
                        {
                                th.addEventListener("click", () =>
                                {
                                        sortKey = key;
                                        draw();
                                });
                        }
                        head.append(th);
                }
                const thead = el("thead");
                thead.append(head);
                const tbody = el("tbody");
                for (const r of rows)
                {
                        const run = isRunning(r);
                        const lang = REPOS[r]?.lang;
                        const row = el("tr", "row");
                        row.tabIndex = 0;
                        row.innerHTML = "<td>" + (1000 + repos.indexOf(r) * 37) + "</td><td>nox</td><td class=\"" + (run ? "g b" : "f") + "\">" + (run ? "R" : "S") + "</td><td>" + (total(r) / all * 100).toFixed(1) + "</td><td>" + total(r) + "c</td><td class=\"d\">" + esc(REPOS[r]?.last.slice(0, 7)) + "</td><td class=\"" + (lang === "C" || lang === "C++" ? "p" : "") + "\">./" + esc(r) + "</td>";
                        row.title = meta(r).sub || r;
                        row.addEventListener("click", () => openProject(r));
                        row.addEventListener("keydown", (e) =>
                        {
                                if (e.key === "Enter")
                                {
                                        openProject(r);
                                }
                        });
                        tbody.append(row);
                }
                table.replaceChildren(thead, tbody);
        }

        draw();
        w.onLang = draw;
        body.addEventListener("keydown", (e) =>
        {
                if (e.key === "F6")
                {
                        sortKey = sortKey === "commits" ? "last" : sortKey === "last" ? "name" : "commits";
                        draw();
                }
                else if (e.key === "F10" || e.key === "q")
                {
                        kill(w);
                }
                else if (e.key === "ArrowDown" || e.key === "ArrowUp")
                {
                        const rows = [...table.querySelectorAll<HTMLTableRowElement>("tr.row")];
                        const i = rows.indexOf(document.activeElement as HTMLTableRowElement);
                        rows[Math.max(0, Math.min(rows.length - 1, i + (e.key === "ArrowDown" ? 1 : -1)))]?.focus();
                }
                else
                {
                        return;
                }
                e.preventDefault();
        });
}

register("htop", render);
