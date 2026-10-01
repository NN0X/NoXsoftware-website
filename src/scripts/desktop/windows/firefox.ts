// A small but real browser: tabs, history, an address bar and bookmarks. It renders about: pages and
// noxsoftware.pl itself (the same content as the plain pages). Other sites refuse to be framed, exactly
// as they would in a real iframe, so they get Firefox's own error page with an "open in new window" link.
import { FEATURED, REPOS, S, data, el, meta, t, total, type Win } from "../core";
import { openProject, register } from "../wm";
import { renderBar } from "../bar";
import { esc } from "../../../lib/esc";
import { normalizeUrl } from "../../../lib/url";

const SITE = "noxsoftware.pl";
const EGGS: Record<string, [string, string]> = {
        "c": ["C", "programinc.webm"],
        "c++isthebest": ["C++ is the best", "c++slander.webm"],
        "linux>windowsallday": ["Linux > Windows, all day", "linuxusers.mp4"],
        "pythonistoobadforbeingthisuseful": ["Python is too bad for being this useful", "pythondeveloper.webm"]
};

interface Tab
{
        history: string[];
        index: number;
        title: string;
}

function render(body: HTMLDivElement, w: Win): void
{
        body.classList.add("ff");
        let tabs: Tab[] = [{ history: ["about:newtab"], index: 0, title: "" }];
        let active = 0;
        const strip = el("div", "tabs");
        const nav = el("div", "nav");
        const marks = el("div", "bm");
        const page = el("div", "page");
        body.append(strip, nav, marks, page);
        const back = el("button", "", "←");
        const forward = el("button", "", "→");
        const reload = el("button", "", "⟳");
        for (const [b, label] of [[back, "Back"], [forward, "Forward"], [reload, "Reload"]] as [HTMLButtonElement, string][])
        {
                b.type = "button";
                b.setAttribute("aria-label", label);
        }
        const url = el("input");
        url.id = "ff-url-" + w.id;
        url.setAttribute("aria-label", "Address bar");
        url.autocomplete = "off";
        url.spellcheck = false;
        nav.append(back, forward, reload, url);
        back.addEventListener("click", () => move(-1));
        forward.addEventListener("click", () => move(1));
        reload.addEventListener("click", () => draw());
        url.addEventListener("keydown", (e) =>
        {
                if (e.key === "Enter")
                {
                        go(url.value);
                        e.preventDefault();
                }
        });
        url.addEventListener("focus", () => url.select());

        const tab = (): Tab => tabs[active]!;
        const current = (): string => tab().history[tab().index] ?? "about:newtab";
        const bySlug = (slug: string): string | undefined => Object.keys(REPOS).find((r) => meta(r).slug === slug.toLowerCase() || r.toLowerCase() === slug.toLowerCase());

        function go(value: string): void
        {
                const u = normalizeUrl(value);
                const tb = tab();
                tb.history = tb.history.slice(0, tb.index + 1);
                if (tb.history[tb.index] !== u)
                {
                        tb.history.push(u);
                        tb.index++;
                }
                draw();
        }
        w.go = go;

        function move(d: number): void
        {
                const tb = tab();
                tb.index = Math.max(0, Math.min(tb.history.length - 1, tb.index + d));
                draw();
        }

        function link(label: string, target: string): HTMLButtonElement
        {
                const b = el("button", "lnk", label);
                b.type = "button";
                b.addEventListener("click", () => go(target));
                return b;
        }

        function external(label: string, href: string): HTMLAnchorElement
        {
                const a = el("a", "", label);
                a.href = href;
                a.target = "_blank";
                a.rel = "noopener";
                return a;
        }

        function newTab(): string
        {
                const box = el("div", "site");
                const search = el("input");
                search.id = "ff-search-" + w.id;
                search.className = "ff-search";
                search.placeholder = t("ff.url");
                search.setAttribute("aria-label", t("ff.url"));
                search.addEventListener("keydown", (e) =>
                {
                        if (e.key === "Enter")
                        {
                                go(search.value);
                        }
                });
                const sites = el("div", "sites");
                const shortcuts: [string, string, string][] = [
                        ["~", "noxsoftware.pl", SITE],
                        ["@", t("ff.mail"), "mailto:nox@noxsoftware.pl"],
                        ["GH", "GitHub", "https://github.com/" + data.user],
                        ["in", "LinkedIn", "https://linkedin.com/in/tomasz-sarkowicz"],
                        ["Su", "Sulla", SITE + "/projects/sulla"],
                        ["T2", "TDC2", SITE + "/projects/tdc2"],
                        ["dw", "dwm config", "https://github.com/" + data.user + "/DWM"],
                        ["R", "about:robots", "about:robots"]
                ];
                for (const [icon, label, target] of shortcuts)
                {
                        const a = el("a");
                        a.append(el("i", "", icon), document.createTextNode(label));
                        if (target.startsWith("mailto:"))
                        {
                                a.href = target;
                        }
                        else
                        {
                                a.href = "#";
                                a.addEventListener("click", (e) =>
                                {
                                        e.preventDefault();
                                        go(target);
                                });
                        }
                        sites.append(a);
                }
                box.append(search, el("h2", "", t("ff.top")), sites, el("div", "addr", "nox@noxsoftware.pl"), el("p", "muted", t("ff.note")));
                page.append(box);
                return t("ff.tab");
        }

        function robots(): string
        {
                const box = el("div", "err");
                box.innerHTML = "<h1>Welcome Humans!</h1><p>We have come to visit you in peace and with goodwill!</p><p>Robots may not injure a human being or, through inaction, allow a human being to come to harm. Robots may, however, refuse to run Windows.</p>";
                const b = el("button", "btn", "Try Again");
                b.type = "button";
                b.addEventListener("click", () =>
                {
                        b.textContent = "Please do not press this button again.";
                });
                box.append(b);
                page.append(box);
                return "Gort!";
        }

        function searchPage(q: string): string
        {
                const box = el("div", "site");
                box.append(el("h1", "", "“" + q + "”"));
                const results = el("div", "res");
                const needle = q.toLowerCase();
                for (const r of Object.keys(REPOS))
                {
                        const m = meta(r);
                        if ((r + " " + m.name + " " + m.sub).toLowerCase().includes(needle))
                        {
                                const row = el("div");
                                row.append(link(SITE + "/projects/" + m.slug, SITE + "/projects/" + m.slug), el("div", "muted", m.sub));
                                results.append(row);
                        }
                }
                if (!results.children.length)
                {
                        results.append(el("p", "muted", "No results on noxsoftware.pl."));
                }
                box.append(results, external("Search the web for “" + q + "” ↗", "https://duckduckgo.com/?q=" + encodeURIComponent(q)));
                page.append(box);
                return q + " — Search";
        }

        function sitePage(path: string): string
        {
                const box = el("div", "site");
                const head = el("header");
                head.append(el("i"), el("h1", "", "NoXsoftware"));
                box.append(head);
                page.append(box);
                const clean = path.replace(/^\/pl(?=\/|$)/, "").replace(/\/+$/, "") || "/";
                if (clean === "/")
                {
                        box.append(el("p", "", t("site.tagline")), el("h2", "", t("site.projects")));
                        const ul = el("ul");
                        for (const p of FEATURED)
                        {
                                const li = el("li");
                                li.append(link(p.name, SITE + "/projects/" + p.slug), document.createTextNode(" — " + meta(p.repo).sub));
                                ul.append(li);
                        }
                        box.append(ul, el("h2", "", t("site.contact")), el("p", "", "nox@noxsoftware.pl · github.com/" + data.user), el("p", "muted", t("ff.plain")));
                        return "NoXsoftware";
                }
                const project = clean.match(/^\/projects\/([^/]+)$/);
                const repo = project ? bySlug(project[1] ?? "") : undefined;
                if (repo)
                {
                        const m = meta(repo);
                        const info = REPOS[repo]!;
                        box.append(el("h1", "", m.name), el("p", "muted", m.sub));
                        if (m.html)
                        {
                                const prose = el("div");
                                prose.innerHTML = m.html;
                                box.append(prose);
                        }
                        box.append(el("h2", "", t("md.glance")), el("p", "", t("f.lang") + ": " + (info.lang || "-") + " · " + t("f.commits") + ": " + total(repo) + " · " + t("f.last") + ": " + info.last + (m.license ? " · " + t("f.lic") + ": " + m.license : "")));
                        const latest = info.log[0];
                        if (latest)
                        {
                                box.append(el("p", "muted", t("md.latest") + ": " + latest[0] + " " + latest[2]));
                        }
                        const row = el("p");
                        const nvim = el("button", "lnk", t("ff.openNvim"));
                        nvim.type = "button";
                        nvim.addEventListener("click", () => openProject(repo));
                        row.append(external("github.com/" + data.user + "/" + repo + " ↗", "https://github.com/" + data.user + "/" + repo), document.createTextNode(" · "), nvim, document.createTextNode(" · "), link("← noxsoftware.pl", SITE));
                        box.append(row);
                        return m.name + " — NoXsoftware";
                }
                const egg = EGGS[decodeURIComponent(clean.slice(1)).replace(/^eggs\//, "")];
                const vid = el("div", "vid");
                if (egg)
                {
                        box.append(el("h1", "", egg[0]));
                        vid.innerHTML = "▶ " + esc(egg[1]) + "<small>" + (S.lang === "pl" ? "tu gra film ze starej strony (przekodowany w kolejnym etapie)" : "the video from the old site plays here (re-encoded in a later phase)") + "</small>";
                        box.append(vid, link("← noxsoftware.pl", SITE));
                        return "NoXsoftware";
                }
                box.append(el("div", "big", "404"), el("p", "", t("site.notFound")));
                vid.innerHTML = "¯\\_(ツ)_/¯<small>" + (S.lang === "pl" ? "tu zostaje gif z Pulp Fiction" : "the confused Pulp Fiction gif stays here") + "</small>";
                box.append(vid, link("← noxsoftware.pl", SITE));
                return "404 — NoXsoftware";
        }

        function blocked(u: string, host: string): string
        {
                const box = el("div", "err");
                box.innerHTML = "<h1>Firefox Can’t Open This Page</h1><p>To protect your security, <b>" + esc(host) + "</b> will not allow Firefox to display the page if another site has embedded it. To see this page, you need to open it in a new window.</p>";
                const a = external("Open Site in New Window", u);
                a.className = "btn";
                box.append(a);
                page.append(box);
                return "Problem loading page";
        }

        function renderPage(u: string): string
        {
                page.replaceChildren();
                if (u === "about:newtab" || u === "about:home")
                {
                        return newTab();
                }
                if (u === "about:robots")
                {
                        return robots();
                }
                if (u === "about:blank")
                {
                        return "New Tab";
                }
                if (u.startsWith("about:search?q="))
                {
                        return searchPage(decodeURIComponent(u.slice(15)));
                }
                const m = u.match(/^https:\/\/(?:www\.)?([^/]+)(\/.*)?$/i);
                const host = (m?.[1] ?? "").toLowerCase();
                if (host === SITE)
                {
                        return sitePage(m?.[2] ?? "/");
                }
                return blocked(u, host || u);
        }

        function draw(): void
        {
                const u = current();
                tab().title = renderPage(u);
                url.value = u === "about:newtab" ? "" : u.replace(/^https:\/\//, "").replace(/^about:search\?q=/, "");
                url.placeholder = t("ff.url");
                back.disabled = tab().index === 0;
                forward.disabled = tab().index >= tab().history.length - 1;
                strip.replaceChildren();
                tabs.forEach((tb, i) =>
                {
                        const b = el("button", "tab" + (i === active ? " on" : ""));
                        b.type = "button";
                        b.append(el("span", "", tb.title || t("ff.tab")));
                        const close = el("span", "tx", "×");
                        close.setAttribute("role", "button");
                        close.setAttribute("aria-label", "Close tab");
                        close.addEventListener("click", (e) =>
                        {
                                e.stopPropagation();
                                tabs.splice(i, 1);
                                if (!tabs.length)
                                {
                                        tabs = [{ history: ["about:newtab"], index: 0, title: "" }];
                                }
                                active = Math.min(active, tabs.length - 1);
                                draw();
                        });
                        b.append(close);
                        b.addEventListener("click", () =>
                        {
                                active = i;
                                draw();
                        });
                        strip.append(b);
                });
                const plus = el("button", "newtab", "+");
                plus.type = "button";
                plus.setAttribute("aria-label", "New tab");
                plus.addEventListener("click", () =>
                {
                        tabs.push({ history: ["about:newtab"], index: 0, title: "" });
                        active = tabs.length - 1;
                        draw();
                        url.focus();
                });
                strip.append(plus);
                marks.replaceChildren(...([["noxsoftware.pl", SITE], [t("site.projects"), SITE + "/projects/sulla"], ["GitHub", "https://github.com/" + data.user], ["c++isthebest", SITE + "/c++isthebest"], ["about:robots", "about:robots"]] as [string, string][]).map(([label, target]) =>
                {
                        const b = el("button", "", label);
                        b.type = "button";
                        b.addEventListener("click", () => go(target));
                        return b;
                }));
                page.scrollTop = 0;
                renderBar();
        }

        w.title = () => (tab().title || t("ff.tab")) + " — Mozilla Firefox";
        w.onLang = draw;
        draw();
}

register("firefox", render);
