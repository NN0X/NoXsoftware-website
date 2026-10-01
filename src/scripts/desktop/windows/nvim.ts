// nvim: a dashboard of the featured projects, then one buffer per project
// (README, a code excerpt, git log and, where there is one, a demo), drawn in a render-markdown style.
import { FEATURED, MONTHS, REPOS, S, data, el, meta, t, total, type Win } from "../core";
import { kill, narrow, openSingle, register } from "../wm";
import { renderBar, setLang, syncUrl } from "../bar";
import { esc } from "../../../lib/esc";
import { activityChart } from "../../../lib/activity";
import { highlight, LANG_NAMES } from "../../../lib/highlight";
import { loadBrutus, tokenize } from "../demos";
import { BRUTUS_MIN_KEY } from "../../../lib/cicero";

const ASCII = [
        "                 .=*-           ",
        "    *%+        :#%-             ",
        "    @-**     .#@-               ",
        "    @- %=   :@#     :+:  .=*-   ",
        "    @- :@: .@#        =%*@+     ",
        "    @-  *% *@.        .%@%.     ",
        "    %-   %*%%  =++-  :@# =@-    ",
        "    #+   .@@% %+  %=:@*   -@=   ",
        "    +#    -@@ =#+*+:@*     :#   ",
        "    .#     :-      .-           "
];

interface Row
{
        html: string;
        cls?: string;
        // false hides the line number (used for the chart)
        numbered?: boolean;
}

type Buffer = [id: string, label: string, icon: string];

function textRow(text: string, cls?: string): Row
{
        return { html: esc(text), cls };
}

// Turns the build-time HTML of a write-up into numbered rows: one per paragraph, heading, list item or quote.
function markdownRows(html: string): Row[]
{
        const holder = document.createElement("div");
        holder.innerHTML = html;
        const rows: Row[] = [];
        for (const node of [...holder.children])
        {
                const tag = node.tagName;
                if (tag === "H1" || tag === "H2" || tag === "H3")
                {
                        rows.push({ html: "", cls: "" }, { html: node.innerHTML, cls: "md-h2" });
                }
                else if (tag === "UL" || tag === "OL")
                {
                        for (const li of [...node.children])
                        {
                                rows.push({ html: li.innerHTML, cls: "md-li" });
                        }
                }
                else if (tag === "BLOCKQUOTE")
                {
                        rows.push({ html: "", cls: "" }, { html: node.textContent?.trim() ? esc(node.textContent.trim()) : "", cls: "md-q" });
                }
                else
                {
                        rows.push({ html: node.innerHTML });
                }
        }
        return rows;
}

function render(body: HTMLDivElement, w: Win): void
{
        body.classList.add("pv", "notree");
        const bufferLine = el("div", "bufl");
        const main = el("div", "pv-main");
        const tree = el("nav", "tree");
        const buf = el("div", "buf");
        buf.tabIndex = 0;
        main.append(tree, buf);
        const statusLine = el("div", "stl");
        const cmdLine = el("div", "cmdl");
        const cmd = el("input");
        cmd.id = "nvcmd-" + w.id;
        cmd.setAttribute("aria-label", "nvim command line");
        const msg = el("span", "ok");
        cmdLine.append(cmd, msg);
        body.append(bufferLine, main, statusLine, cmdLine);

        let repo: string | null = null;
        let current = "readme";
        let buffers: Buffer[] = [];
        const gh = (r: string): string => "https://github.com/" + data.user + "/" + r;

        w.title = () =>
        {
                if (!repo)
                {
                        return "nvim";
                }
                const b = buffers.find((x) => x[0] === current);
                return "nvim " + repo + "/" + (b ? b[1] : "");
        };

        function status(file: string, filetype: string, pos: string): void
        {
                const branch = repo ? REPOS[repo]?.branch ?? "master" : "";
                statusLine.innerHTML = "<span class=\"mode\">NORMAL</span>" + (repo ? "<span class=\"br\"> " + esc(branch) + "</span>" : "") + "<span class=\"fn\">" + esc(file) + "</span><span class=\"d\">" + esc(filetype) + "</span><span class=\"d\">utf-8</span><span class=\"pos\">" + esc(pos) + "</span>";
        }

        function lines(rows: Row[], start = 1, code = false): void
        {
                buf.replaceChildren();
                let n = start;
                rows.forEach((r, i) =>
                {
                        const ln = el("div", "ln" + (i === 0 ? " cur" : ""));
                        ln.append(el("span", "no", r.numbered === false ? "" : String(n++)));
                        const tx = el("span", "tx" + (code ? " code" : "") + (r.cls ? " " + r.cls : ""));
                        tx.innerHTML = r.html;
                        ln.append(tx);
                        buf.append(ln);
                });
                buf.scrollTop = 0;
        }

        function home(): void
        {
                repo = null;
                const started = performance.now();
                const tab = el("button", "on");
                tab.type = "button";
                tab.append(el("span", "ic", "◆"), document.createTextNode("dashboard"));
                bufferLine.replaceChildren(tab);
                body.classList.add("notree");
                const dash = el("div", "dash");
                dash.append(el("pre", "logo", ASCII.join("\n")), el("div", "tag-line", t("site.tagline")));
                const list = el("div", "list");
                list.append(el("h3", "", t("site.projects")));
                for (const p of FEATURED)
                {
                        const b = el("button", "item");
                        b.type = "button";
                        b.append(el("span", "k", p.key), el("span", "n", p.name), el("span", "s", meta(p.repo).sub), el("span", "l", REPOS[p.repo]?.lang ?? ""), el("span", "t", REPOS[p.repo]?.last.slice(0, 7) ?? ""));
                        b.addEventListener("click", () => open(p.repo));
                        list.append(b);
                }
                const allRepos = el("button", "item");
                allRepos.type = "button";
                allRepos.append(el("span", "k", "a"), el("span", "n", t("site.allRepos")), el("span", "s", t("dash.all")), el("span", "l", ""), el("span", "t", ""));
                allRepos.addEventListener("click", () => openSingle("htop", 1));
                list.append(allRepos);
                const foot = el("div", "foot");
                dash.append(list, foot);
                buf.replaceChildren(dash);
                foot.textContent = "⚡ " + t("dash.loaded", { n: Object.keys(REPOS).length, ms: (performance.now() - started).toFixed(2) });
                status("[dashboard]", "", "");
                cmd.placeholder = t("nv.phDash");
                syncUrl(null);
                renderBar();
        }
        w.home = home;

        function tabs(): void
        {
                const back = el("button");
                back.type = "button";
                back.append(el("span", "ic", "◂"), document.createTextNode("dashboard"));
                back.addEventListener("click", home);
                const nodes: HTMLElement[] = [back];
                for (const [id, label, icon] of buffers)
                {
                        const x = el("button", id === current ? "on" : "");
                        x.type = "button";
                        x.append(el("span", "ic", icon), document.createTextNode(label));
                        x.addEventListener("click", () => show(id));
                        nodes.push(x);
                }
                nodes.push(el("span", "sp"));
                if (repo && !narrow() && REPOS[repo]?.tree.length)
                {
                        const toggle = el("button", "", (body.classList.contains("notree") ? "▸ " : "◂ ") + "tree");
                        toggle.type = "button";
                        toggle.title = ":Neotree toggle";
                        toggle.addEventListener("click", () =>
                        {
                                body.classList.toggle("notree");
                                tabs();
                        });
                        nodes.push(toggle);
                }
                bufferLine.replaceChildren(...nodes);
        }

        function drawTree(): void
        {
                if (!repo)
                {
                        return;
                }
                const r = REPOS[repo]!;
                tree.replaceChildren(el("span", "root", "  " + repo));
                const exDir = r.excerpt ? r.excerpt.path.split("/").slice(0, -1) : [];
                for (const [name, isTree] of r.tree)
                {
                        if (name === "README.md")
                        {
                                const b = el("button", current === "readme" ? "on" : "", "  README.md");
                                b.type = "button";
                                b.addEventListener("click", () => show("readme"));
                                tree.append(b);
                                continue;
                        }
                        const a = el("a", isTree ? "dir" : "", (isTree ? (exDir[0] === name ? "▾ " : "▸ ") : "  ") + name + (isTree ? "/" : ""));
                        a.href = gh(repo) + "/" + (isTree ? "tree" : "blob") + "/HEAD/" + name;
                        tree.append(a);
                        if (exDir[0] === name && r.excerpt)
                        {
                                let depth = 1;
                                for (const sub of exDir.slice(1))
                                {
                                        const s = el("span", "x dir", "▾ " + sub + "/");
                                        s.style.paddingLeft = depth * 2 + "ch";
                                        tree.append(s);
                                        depth++;
                                }
                                const file = el("button", current === "code" ? "on" : "", "  " + r.excerpt.path.split("/").pop());
                                file.type = "button";
                                file.style.paddingLeft = depth * 2 + "ch";
                                file.addEventListener("click", () => show("code"));
                                tree.append(file);
                        }
                }
        }

        function open(r: string, section?: string): void
        {
                repo = r;
                const info = REPOS[r]!;
                const m = meta(r);
                buffers = [["readme", "README.md", "◆"]];
                if (info.excerpt)
                {
                        buffers.push(["code", info.excerpt.path.split("/").pop() ?? "code", "λ"]);
                }
                buffers.push(["log", "git log", "●"]);
                if (m.demo)
                {
                        buffers.push(["demo", "demo", "▶"]);
                }
                body.classList.toggle("notree", narrow() || window.innerWidth < 1200 || !info.tree.length);
                cmd.placeholder = t("nv.ph");
                if (!show(section ?? "readme"))
                {
                        show("readme");
                }
                syncUrl(r);
        }
        w.open = open;

        function readmeRows(r: string): Row[]
        {
                const info = REPOS[r]!;
                const m = meta(r);
                const rows: Row[] = [textRow(m.name, "md-h1"), textRow("")];
                if (m.sub)
                {
                        rows.push(textRow(m.sub, "md-q"), textRow(""));
                }
                if (m.html)
                {
                        rows.push(...markdownRows(m.html));
                }
                else
                {
                        rows.push({ html: "<span class=\"d\">" + esc(t("md.nowrite")) + "</span>" });
                }
                rows.push(textRow(""), textRow(t("md.glance"), "md-h2"));
                const peak = Object.entries(info.activity).sort((a, b) => b[1] - a[1])[0] ?? ["-", 0];
                const facts: [string, string][] = [[t("f.lang"), info.lang || "-"], [t("f.commits"), String(total(r))], [t("f.last"), info.last], [t("f.peak"), peak[1] + " · " + peak[0]]];
                if (m.license)
                {
                        facts.push([t("f.lic"), m.license]);
                }
                rows.push({ html: "<div class=\"facts\">" + facts.map(([k, v]) => "<span><i>" + esc(k) + "</i>" + esc(v) + "</span>").join("") + "</div>" });
                rows.push({ html: activityChart(info.activity, MONTHS, t("chart")), numbered: false });
                const latest = info.log[0];
                if (latest)
                {
                        rows.push({ html: "<span class=\"y\">" + esc(t("md.latest")) + "</span>  <a href=\"" + gh(r) + "/commit/" + esc(latest[0]) + "\">" + esc(latest[0]) + "</a> " + esc(latest[2]) });
                }
                rows.push(textRow(""), textRow(t("md.links"), "md-h2"));
                rows.push({ html: "<a href=\"" + gh(r) + "\">" + esc(gh(r).replace("https://", "")) + "</a>", cls: "md-li" });
                if (m.authors)
                {
                        rows.push(textRow(t("f.authors") + ": " + m.authors, "md-li"));
                }
                if (m.demo)
                {
                        rows.push(textRow(""), { html: "<span class=\"y b\">" + esc(t("md.try")) + "</span>" });
                }
                return rows;
        }

        function demo(r: string): void
        {
                const m = meta(r);
                buf.replaceChildren();
                const wrap = el("div");
                wrap.style.padding = "4px 22px";
                const isCicero = m.demo === "cicero";
                wrap.append(el("div", "d", t(isCicero ? "demo.cicero" : "demo.brutus")));
                const field = (label: string, id: string, value: string): HTMLInputElement =>
                {
                        const f = el("div");
                        f.style.marginTop = "10px";
                        const lab = el("label", "y", label.padEnd(6));
                        const input = el("input", "demo-in");
                        input.id = id;
                        lab.htmlFor = id;
                        input.value = value;
                        f.append(lab, input);
                        wrap.append(f);
                        return input;
                };
                const first = field(isCicero ? t("demo.text") : t("demo.key"), "demo1-" + w.id, isCicero ? "great product, would buy again" : "et tu");
                const second = isCicero ? null : field(t("demo.text"), "demo2-" + w.id, "Brutus should not be trusted");
                const result = el("div");
                result.style.marginTop = "14px";
                const stat = el("div", "f");
                wrap.append(result, stat);
                buf.append(wrap);
                const dropped = el("div", "y");
                wrap.append(dropped);
                stat.textContent = t("demo.loading", { f: isCicero ? "cicero.wasm" : "brutus.wasm" });
                let pending: ReturnType<typeof setTimeout> | undefined;
                let generation = 0;
                const fail = (err: Error): void =>
                {
                        stat.className = "r";
                        stat.textContent = t("demo.failed", { e: err.message });
                };
                const update = (): void =>
                {
                        const mine = ++generation;
                        if (isCicero)
                        {
                                tokenize(first.value).then((r) =>
                                {
                                        if (mine !== generation)
                                        {
                                                return;
                                        }
                                        result.replaceChildren(...r.pieces.map((piece, i) =>
                                        {
                                                const tok = el("span", "tk", piece.replace(/ /g, "·"));
                                                tok.append(el("sub", "", String(r.ids[i])));
                                                return tok;
                                        }));
                                        stat.className = "f";
                                        stat.textContent = t("demo.tokens", { n: r.ids.length, c: first.value.length, d: r.size });
                                        dropped.textContent = r.dropped.length ? t("demo.dropped", { c: r.dropped.join(" ") }) : "";
                                }).catch(fail);
                        }
                        else if (second)
                        {
                                if (first.value.length < BRUTUS_MIN_KEY)
                                {
                                        result.textContent = "";
                                        stat.className = "r";
                                        stat.textContent = t("demo.keyShort", { n: BRUTUS_MIN_KEY });
                                        return;
                                }
                                loadBrutus().then((encrypt) =>
                                {
                                        if (mine !== generation)
                                        {
                                                return;
                                        }
                                        const enc = encrypt(second.value, first.value);
                                        const bytes = (s: string): number => new TextEncoder().encode(s).length;
                                        result.innerHTML = "<span class=\"g\">" + esc(enc) + "</span>";
                                        stat.className = "f";
                                        stat.textContent = t("demo.ratio", { a: bytes(second.value), b: bytes(enc) });
                                }).catch(fail);
                        }
                };
                const debounced = (): void =>
                {
                        clearTimeout(pending);
                        pending = setTimeout(update, 120);
                };
                first.addEventListener("input", debounced);
                second?.addEventListener("input", debounced);
                update();
        }

        function show(name: string): boolean
        {
                if (!repo || !buffers.some((b) => b[0] === name))
                {
                        return false;
                }
                current = name;
                tabs();
                drawTree();
                const r = repo;
                const info = REPOS[r]!;
                if (name === "readme")
                {
                        lines(readmeRows(r));
                        status(r + "/README.md", "markdown", "1:1");
                }
                else if (name === "code" && info.excerpt)
                {
                        const ex = info.excerpt;
                        const count = ex.code.split("\n").length;
                        lines(highlight(ex.code, ex.lang).map((h) => ({ html: h })), ex.from, true);
                        const note = el("div", "ln");
                        const text = el("span", "tx f");
                        text.innerHTML = "-- " + t("code.note", { a: ex.from, b: ex.from + count - 1, p: "<a href=\"" + gh(r) + "/blob/HEAD/" + esc(ex.path) + "\">" + esc(ex.path) + "</a>" });
                        note.append(el("span", "no", ""), text);
                        buf.prepend(note);
                        status(r + "/" + ex.path, LANG_NAMES[ex.lang] ?? ex.lang, ex.from + ":1");
                }
                else if (name === "log")
                {
                        const rows: Row[] = [{ html: "<span class=\"d\">$ git log --oneline --no-merges -" + info.log.length + "</span>" }, textRow("")];
                        info.log.forEach(([hash, date, message], i) =>
                        {
                                rows.push({ html: "<span class=\"p\">" + (i === 0 ? "●" : "○") + "</span> <a class=\"y\" href=\"" + gh(r) + "/commit/" + esc(hash) + "\">" + esc(hash) + "</a> <span class=\"f\">" + esc(date) + "</span>  " + esc(message) });
                                if (i < info.log.length - 1)
                                {
                                        rows.push({ html: "<span class=\"p\">│</span>" });
                                }
                        });
                        rows.push(textRow(""), { html: "<a href=\"" + gh(r) + "/commits\">" + esc(t("log.full")) + "</a>" });
                        lines(rows);
                        status("fugitive://" + r + "/.git", "git", "1:1");
                }
                else if (name === "demo")
                {
                        demo(r);
                        status(r + " :demo", "wasm", "1:1");
                }
                renderBar();
                return true;
        }

        w.onLang = () =>
        {
                if (repo)
                {
                        cmd.placeholder = t("nv.ph");
                        show(current);
                }
                else
                {
                        home();
                }
        };

        cmd.addEventListener("keydown", (e) =>
        {
                if (e.key === "Escape")
                {
                        cmd.value = "";
                        buf.focus();
                        return;
                }
                if (e.key !== "Enter")
                {
                        return;
                }
                const v = cmd.value.trim().replace(/^:/, "");
                cmd.value = "";
                msg.className = "ok";
                msg.textContent = "";
                const fail = (text: string): void =>
                {
                        msg.className = "msg";
                        msg.textContent = text;
                };
                if (/^(q|q!|wq|x|bd)$/.test(v))
                {
                        if (repo)
                        {
                                home();
                        }
                        else
                        {
                                kill(w);
                        }
                        return;
                }
                if (/^qa!?$/.test(v))
                {
                        kill(w);
                        return;
                }
                const edit = v.match(/^e\s+(\S+)/);
                if (edit)
                {
                        const target = (edit[1] ?? "").toLowerCase();
                        const b = buffers.find((x) => x[0] === target || x[1].toLowerCase() === target);
                        const other = Object.keys(REPOS).find((r) => r.toLowerCase() === target || meta(r).name.toLowerCase() === target);
                        if (b)
                        {
                                show(b[0]);
                        }
                        else if (other)
                        {
                                open(other);
                        }
                        else
                        {
                                fail("E32: No file name");
                        }
                        return;
                }
                const lang = v.match(/^lang(?:uage)?\s+(\w\w)/);
                if (lang && (lang[1] === "pl" || lang[1] === "en"))
                {
                        setLang(lang[1]);
                        return;
                }
                if (/^(Dashboard|Alpha)$/.test(v))
                {
                        home();
                        return;
                }
                if (v === "help")
                {
                        msg.textContent = ":q · :e readme|code|log|demo|<project> · :Neotree · :lang pl|en";
                        return;
                }
                if (/^Neotree/.test(v) && repo)
                {
                        body.classList.toggle("notree");
                        tabs();
                        return;
                }
                if (v === "w")
                {
                        fail("E45: 'readonly' option is set (add ! to override)");
                        return;
                }
                if (v)
                {
                        fail("E492: Not an editor command: " + v);
                }
        });

        body.addEventListener("keydown", (e) =>
        {
                const target = e.target as HTMLElement;
                if (target === cmd || target.tagName === "INPUT" || e.altKey || e.ctrlKey || e.metaKey)
                {
                        return;
                }
                if (e.key === ":")
                {
                        cmd.focus();
                        e.preventDefault();
                        return;
                }
                if (!repo)
                {
                        const p = FEATURED.find((x) => x.key === e.key);
                        if (p)
                        {
                                open(p.repo);
                        }
                        else if (e.key === "a")
                        {
                                openSingle("htop", 1);
                        }
                        else if (e.key === "q")
                        {
                                kill(w);
                        }
                        return;
                }
                if (e.key === "j")
                {
                        buf.scrollTop += 26;
                }
                else if (e.key === "k")
                {
                        buf.scrollTop -= 26;
                }
                else if (e.key === "q")
                {
                        home();
                }
        });
        w.onFocus = () =>
        {
                if (!body.contains(document.activeElement))
                {
                        buf.focus({ preventScroll: true });
                }
                if (S.tag === 2)
                {
                        syncUrl(repo);
                }
        };
        home();
}

register("nvim", render);
