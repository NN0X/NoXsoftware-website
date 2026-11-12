// F1Ratings on tag 3: the XRating tables from /data/f1.json, regenerated on the Pi after race weekends.
import { el, t, type Win } from "../core";
import { kill, register } from "../wm";
import { loadF1, F1Missing } from "../../f1load";
import { esc } from "../../../lib/esc";
import { chartSvg, f1Rows, findEntry, type F1Data, type F1Entry, type F1Options, type F1Set, type F1Sort, type F1View } from "../../../lib/f1";

function render(body: HTMLDivElement, w: Win): void
{
        body.classList.add("f1");
        w.title = () => "st: python main.py print";
        let data: F1Data | null = null;
        let set: F1Set = "drivers";
        let view: F1View = "grid";
        let sort: F1Sort = "now";
        let ascending = false;
        let query = "";
        let picked: string | null = null;
        // a `plot <name>` that arrived before the data did
        let wanted: string | null = null;

        const head = el("pre", "head");
        const info = el("div", "info");
        const controls = el("div", "tabs");
        const search = el("input", "search");
        search.type = "search";
        search.id = "f1-search-" + w.id;
        search.autocomplete = "off";
        search.spellcheck = false;
        const tw = el("div", "tw");
        const chart = el("div", "plot");
        const keys = el("div", "keys");
        body.append(head, info, controls, tw, chart, keys);
        search.addEventListener("input", () =>
        {
                query = search.value;
                drawTable();
        });

        function list(): F1Entry[]
        {
                return data ? data[set] : [];
        }

        function button(label: string, on: boolean, click: () => void): HTMLButtonElement
        {
                const b = el("button", on ? "on" : "", label);
                b.type = "button";
                b.setAttribute("aria-pressed", String(on));
                b.addEventListener("click", click);
                return b;
        }

        function drawControls(): void
        {
                search.placeholder = t("f1.search");
                search.setAttribute("aria-label", t("f1.search"));
                const pick = (s: F1Set): void =>
                {
                        set = s;
                        picked = null;
                        draw();
                };
                const look = (v: F1View): void =>
                {
                        view = v;
                        drawControls();
                        drawTable();
                };
                controls.replaceChildren(
                        button(t("f1.drivers"), set === "drivers", () => pick("drivers")),
                        button(t("f1.teams"), set === "teams", () => pick("teams")),
                        el("span", "gap"),
                        button(t("f1.grid"), view === "grid", () => look("grid")),
                        button(t("f1.all"), view === "all", () => look("all")),
                        el("span", "gap"),
                        search
                );
        }

        function drawTable(): void
        {
                const rows = f1Rows(list(), view, sort, ascending, query);
                if (!rows.length)
                {
                        tw.replaceChildren(el("p", "f", t("f1.empty")));
                        return;
                }
                const all = list();
                const top = Math.max(...all.map((e) => e.current));
                const low = Math.min(...all.map((e) => e.current));
                const table = el("table");
                const tr = el("tr");
                const columns: [string, F1Sort | null][] = [["#", null], [t(set === "drivers" ? "f1.driver" : "f1.team"), "name"], [t("f1.now"), "now"], [t("f1.peak"), "peak"], ["", null], ["Δ", "delta"]];
                for (const [label, key] of columns)
                {
                        const th = el("th", "", label);
                        if (key)
                        {
                                if (key === sort)
                                {
                                        th.setAttribute("aria-sort", ascending ? "ascending" : "descending");
                                }
                                th.tabIndex = 0;
                                const click = (): void =>
                                {
                                        if (sort === key)
                                        {
                                                ascending = !ascending;
                                        }
                                        else
                                        {
                                                sort = key;
                                                ascending = key === "name";
                                        }
                                        drawTable();
                                };
                                th.addEventListener("click", click);
                                th.addEventListener("keydown", (e) =>
                                {
                                        if (e.key === "Enter")
                                        {
                                                click();
                                        }
                                });
                        }
                        tr.append(th);
                }
                const thead = el("thead");
                thead.append(tr);
                const tbody = el("tbody");
                rows.forEach((e, i) =>
                {
                        const row = el("tr", "row" + (e.name === picked ? " on" : ""));
                        row.tabIndex = 0;
                        row.dataset.name = e.name;
                        const bar = top === low ? 14 : Math.max(0.5, (e.current - low) / (top - low) * 14);
                        const change = e.change === null ? "" : (e.change > 0 ? "+" : "") + e.change.toFixed(1);
                        row.innerHTML = "<td class=\"f\">" + (i + 1) + "</td><td>" + esc(e.name) + (e.onGrid && view === "all" ? " <span class=\"g\">●</span>" : "") + "</td>"
                                + "<td class=\"b\">" + e.current + "</td><td class=\"d\">" + e.peak + " <span class=\"f\">" + esc(e.peakDate?.slice(0, 4) ?? "") + "</span></td>"
                                + "<td><span class=\"bar\" style=\"width:" + bar.toFixed(1) + "ch\"></span></td>"
                                + "<td class=\"" + (e.change === null || e.change === 0 ? "f" : e.change < 0 ? "r" : "g") + "\">" + change + "</td>";
                        row.title = e.peakDate ? t("f1.peakOn", { d: e.peakDate }) : "";
                        row.addEventListener("click", () => select(e.name));
                        row.addEventListener("keydown", (ev) =>
                        {
                                if (ev.key === "Enter")
                                {
                                        select(e.name);
                                }
                        });
                        tbody.append(row);
                });
                table.append(thead, tbody);
                tw.replaceChildren(table);
        }

        function drawChart(): void
        {
                const e = picked ? list().find((x) => x.name === picked) : undefined;
                if (!e)
                {
                        chart.innerHTML = "<p class=\"f\">" + esc(t("f1.pick")) + "</p>";
                        return;
                }
                chart.innerHTML = "<div class=\"ph\"><span class=\"p b\">" + esc(e.name) + "</span> <span class=\"f\">" + esc(t("f1.history", { n: e.current, p: e.peak, d: e.peakDate ?? "N/A" })) + "</span></div>" + chartSvg(e, t("f1.noHistory"));
        }

        function select(name: string): void
        {
                picked = picked === name ? null : name;
                for (const row of tw.querySelectorAll<HTMLTableRowElement>("tr.row"))
                {
                        row.classList.toggle("on", row.dataset.name === picked);
                }
                drawChart();
        }

        function draw(): void
        {
                head.innerHTML = "<span class=\"g b\">➜</span>  <span class=\"c b\">F1Ratings</span> <span class=\"bl b\">git:(</span><span class=\"r b\">master</span><span class=\"bl b\">)</span> python main.py print";
                keys.innerHTML = "<span><b>click</b>" + esc(t("f1.sort")) + "</span><span><b>/</b>" + esc(t("f1.search")) + "</span><span><b>t</b>" + esc(t("f1.teams")) + "</span><span><b>a</b>" + esc(t("f1.all")) + "</span><span class=\"f\">" + esc(t("f1.goat")) + "</span>";
                if (!data)
                {
                        return;
                }
                const commit = data.source.commit ? data.source.commit.slice(0, 7) : "?";
                info.innerHTML = "<span class=\"f\"># " + esc(data.lastRace ? t("f1.lastRace", { r: data.lastRace.name, d: data.lastRace.date }) : "") + " · " + esc(t("f1.generated", { d: data.generated.slice(0, 10) }))
                        + " <a href=\"https://github.com/" + esc(data.source.repo) + "/commit/" + esc(data.source.commit ?? "") + "\">" + esc(data.source.repo.split("/").pop() + "@" + commit) + "</a></span>"
                        + (data.fixture ? "\n<span class=\"y\">" + esc(t("f1.sample")) + "</span>" : "");
                drawControls();
                drawTable();
                drawChart();
        }

        function failed(err: unknown): void
        {
                const missing = err instanceof F1Missing;
                info.innerHTML = missing
                        ? "<span class=\"y\">" + esc(t("f1.missing")) + "</span>\n<span class=\"f\">$ systemctl start noxsoftware-f1   # " + esc(t("f1.onPi")) + "\n$ npm run f1:fixture              # " + esc(t("f1.locally")) + "</span>"
                        : "<span class=\"r\">" + esc(t("f1.failed", { e: err instanceof Error ? err.message : String(err) })) + "</span>";
                const retry = button(t("f1.retry"), false, () => load());
                controls.replaceChildren(retry);
                tw.replaceChildren();
                chart.replaceChildren();
        }

        function load(): void
        {
                info.innerHTML = "<span class=\"f\">" + esc(t("f1.loading")) + "</span>";
                loadF1().then((d) =>
                {
                        data = d;
                        resolvePick();
                        draw();
                }).catch(failed);
        }

        function resolvePick(): void
        {
                if (!data || wanted === null)
                {
                        return;
                }
                // look in the current set first, then the other one, so `plot ferrari` just works
                const other: F1Set = set === "drivers" ? "teams" : "drivers";
                const here = findEntry(data[set], wanted);
                const hit = here ?? findEntry(data[other], wanted);
                if (hit && !here)
                {
                        set = other;
                }
                if (hit && !hit.onGrid)
                {
                        view = "all";
                }
                picked = hit?.name ?? null;
                wanted = null;
        }

        w.f1 = (o: F1Options) =>
        {
                set = o.set ?? set;
                view = o.view ?? view;
                if (o.sort)
                {
                        sort = o.sort;
                }
                if (o.sort || o.ascending !== undefined)
                {
                        ascending = o.ascending ?? sort === "name";
                }
                if (o.pick !== undefined)
                {
                        wanted = o.pick;
                        resolvePick();
                }
                draw();
        };
        w.onLang = draw;
        body.addEventListener("keydown", (e) =>
        {
                if (e.target === search)
                {
                        if (e.key === "Escape")
                        {
                                search.blur();
                                body.focus();
                        }
                        return;
                }
                if (e.key === "/")
                {
                        search.focus();
                }
                else if (e.key === "t")
                {
                        set = set === "drivers" ? "teams" : "drivers";
                        picked = null;
                        draw();
                }
                else if (e.key === "a")
                {
                        view = view === "grid" ? "all" : "grid";
                        draw();
                }
                else if (e.key === "q")
                {
                        kill(w);
                }
                else if (e.key === "ArrowDown" || e.key === "ArrowUp")
                {
                        const rows = [...tw.querySelectorAll<HTMLTableRowElement>("tr.row")];
                        const i = rows.indexOf(document.activeElement as HTMLTableRowElement);
                        rows[Math.max(0, Math.min(rows.length - 1, i + (e.key === "ArrowDown" ? 1 : -1)))]?.focus();
                }
                else
                {
                        return;
                }
                e.preventDefault();
        });
        body.tabIndex = -1;
        w.onFocus = () =>
        {
                if (!body.contains(document.activeElement))
                {
                        body.focus({ preventScroll: true });
                }
        };
        draw();
        load();
}

register("f1", render);
