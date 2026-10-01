// The dwm bar, the help line under the desktop, and language switching.
import { S, TAGS, el, meta, pathFor, store, t, type Win } from "./core";
import { cycleLayout, effLayout, kill, narrow, nextTag, setLayout, spawnTerm, step, view, visible, zoom } from "./wm";
import { openLauncher } from "./dmenu";
import { notify } from "./fx";
import { esc } from "../../lib/esc";
import type { Lang } from "../../data/types";

let barEl: HTMLDivElement;
let hintEl: HTMLDivElement;
let clockNode: HTMLSpanElement | null = null;
let temperature = "--";

const WEATHER_URL = "https://api.open-meteo.com/v1/forecast?latitude=50.06&longitude=19.94&current=temperature_2m";
const WEATHER_TTL = 10 * 60 * 1000;

export function setBarNodes(bar: HTMLDivElement, hint: HTMLDivElement): void
{
        barEl = bar;
        hintEl = hint;
}

// Same idea as get_weather.sh: ask Open-Meteo at most every 10 minutes.
export async function loadWeather(): Promise<void>
{
        try
        {
                const cached = JSON.parse(store("nox-weather") ?? "null") as { at: number; temp: string } | null;
                if (cached && Date.now() - cached.at < WEATHER_TTL)
                {
                        temperature = cached.temp;
                        tick();
                        return;
                }
                const res = await fetch(WEATHER_URL);
                const body = await res.json() as { current?: { temperature_2m?: number } };
                const value = body.current?.temperature_2m;
                if (typeof value === "number")
                {
                        temperature = String(Math.round(value));
                        store("nox-weather", JSON.stringify({ at: Date.now(), temp: temperature }));
                        tick();
                }
        }
        catch
        {
                // offline or blocked: the bar keeps showing --°C
        }
}

function statusHtml(): string
{
        // Kraków, always: the bar shows where the machine lives, not where the visitor is.
        const now = new Date();
        const loc = S.lang === "pl" ? "pl-PL" : "en-GB";
        const tz = { timeZone: "Europe/Warsaw" };
        const day = now.toLocaleDateString(loc, { weekday: "long", ...tz });
        const date = now.toLocaleDateString(loc, { day: "2-digit", month: "2-digit", year: "numeric", ...tz });
        const time = now.toLocaleTimeString(loc, { hour: "2-digit", minute: "2-digit", second: "2-digit", ...tz });
        const hour = Number(now.toLocaleTimeString("en-GB", { hour: "2-digit", hour12: false, ...tz }).slice(0, 2));
        const sky = hour >= 7 && hour < 19 ? "☀" : "☾";
        const sep = "<span class=\"sep wide\">|</span>";
        return "<span class=\"wide wx\" title=\"" + esc(t("wx")) + "\">" + sky + " Kraków " + esc(temperature) + "°C</span>" + sep + "<span class=\"wide\">" + esc(day) + "</span>" + sep + "<span class=\"wide\">" + esc(date) + "</span>" + sep + "<span>" + esc(time) + "</span>";
}

export function tick(): void
{
        if (clockNode)
        {
                clockNode.innerHTML = statusHtml();
        }
}

function titleOf(w: Win): string
{
        return w.title();
}

export function renderBar(): void
{
        if (!barEl)
        {
                return;
        }
        const f = S.focused[S.tag];
        const vis = visible();
        const bar = el("div", "dbar");

        const logo = el("button", "barlogo");
        logo.type = "button";
        logo.title = "dmenu (alt+p)";
        logo.setAttribute("aria-label", "Open dmenu");
        logo.append(el("i"));
        logo.addEventListener("click", openLauncher);

        const tags = el("div", "tags");
        for (let i = 1; i <= 9; i++)
        {
                const occupied = S.wins.some((w) => w.tag === i);
                // hide-vacant-tags patch, on narrow screens only
                if (narrow() && !occupied && i !== S.tag)
                {
                        continue;
                }
                const focusedHere = S.focused[i]?.tag === i;
                const b = el("button", "tag" + (occupied ? " occ" : "") + (i === S.tag ? " sel" : "") + (focusedHere ? " has" : ""), narrow() ? String(i) : TAGS[i - 1]);
                b.type = "button";
                b.setAttribute("aria-label", "Tag " + i + " " + TAGS[i - 1] + (occupied ? ", has windows" : ""));
                b.setAttribute("aria-pressed", String(i === S.tag));
                b.addEventListener("click", () => view(i));
                tags.append(b);
        }

        const lay = effLayout();
        const lt = el("button", "lt", lay === "tile" ? "[]=" : lay === "float" ? "><>" : "[" + vis.length + "]");
        lt.type = "button";
        lt.title = "tile → monocle → floating (alt+space)";
        lt.addEventListener("click", cycleLayout);
        lt.addEventListener("contextmenu", (e) =>
        {
                e.preventDefault();
                setLayout("mono");
        });

        const has = f !== undefined && f.tag === S.tag;
        const tw = el("div", "titlewrap" + (has ? "" : " empty"));
        const title = el("button", "title", has && f ? titleOf(f) : "");
        title.type = "button";
        title.title = "click: focus next · middle-click: zoom";
        title.addEventListener("click", () => step(1));
        title.addEventListener("auxclick", (e) =>
        {
                if (e.button === 1)
                {
                        zoom();
                }
        });
        tw.append(title);
        if (has && f)
        {
                const x = el("button", "x", "×");
                x.type = "button";
                x.title = "killclient (alt+shift+c)";
                x.setAttribute("aria-label", "Close " + titleOf(f));
                x.addEventListener("click", () => kill(f));
                tw.append(x);
        }

        const kbd = el("button", "kbd", "[" + (S.lang === "pl" ? "pl" : "us") + "]");
        kbd.type = "button";
        kbd.title = t("kbd");
        kbd.setAttribute("aria-label", t("kbd"));
        kbd.addEventListener("click", () => setLang(S.lang === "pl" ? "en" : "pl"));
        const status = el("div", "status");
        const clock = el("span");
        clock.innerHTML = statusHtml();
        clockNode = clock;
        status.append(kbd, el("span", "sep", "|"), clock);
        status.title = "middle-click: new terminal";
        status.addEventListener("auxclick", (e) =>
        {
                if (e.button === 1)
                {
                        spawnTerm();
                }
        });

        bar.append(logo, tags, lt, tw, status);
        barEl.replaceChildren(bar);
        document.title = has && f ? titleOf(f) + " — NoXsoftware" : "NoXsoftware";
}

export function renderHint(): void
{
        const keys = el("div", "keys2");
        const chips: [string, string, () => void][] = [
                ["alt+p", t("k.dmenu"), openLauncher],
                ["alt+1…9", t("k.tags"), nextTag],
                ["alt+shift+⏎", t("k.term"), spawnTerm],
                ["alt+j/k", t("k.focus"), () => step(1)],
                ["alt+t/m/f", t("k.layout"), cycleLayout],
                ["alt+shift+c", t("k.close"), () => kill(S.focused[S.tag])]
        ];
        for (const [combo, label, action] of chips)
        {
                const chip = el("button", "chip");
                chip.type = "button";
                chip.append(el("kbd", "", combo), document.createTextNode(" " + label));
                chip.addEventListener("click", action);
                keys.append(chip);
        }
        const help = el("span", "new");
        help.append(document.createTextNode(t("hint.helpPre")));
        const helpBtn = el("button", "", "help");
        helpBtn.type = "button";
        helpBtn.addEventListener("click", () =>
        {
                const term = S.wins.find((w) => w.kind === "zsh");
                if (term)
                {
                        view(term.tag);
                        term.run?.("help");
                }
        });
        help.append(helpBtn, document.createTextNode(t("hint.helpPost") + " " + t("hint.new") + " "));
        const plain = el("button", "", t("hint.plain"));
        plain.type = "button";
        plain.addEventListener("click", () =>
        {
                store("nox-plain", "1");
                location.reload();
        });
        help.append(plain);
        hintEl.replaceChildren(keys, help);
}

export function setLang(lang: Lang, quiet = false): void
{
        S.lang = lang;
        store("nox-lang", lang);
        document.documentElement.lang = lang;
        // keep the address bar pointing at the same page in the new language
        const path = location.pathname.replace(/^\/pl(\/|$)/, "/");
        history.replaceState(null, "", pathFor(lang, path) + location.search);
        for (const w of S.wins)
        {
                w.onLang?.();
        }
        renderHint();
        renderBar();
        if (!quiet)
        {
                notify("setxkbmap " + (lang === "pl" ? "pl" : "us"), t("lang.switched"));
        }
}

let urlSync = false;

// Off while booting, so spawning windows does not rewrite the address the visitor arrived at.
export function enableUrlSync(): void
{
        urlSync = true;
}

export function syncUrl(repo: string | null): void
{
        if (!urlSync)
        {
                return;
        }
        const path = repo ? "/projects/" + meta(repo).slug + "/" : "/";
        history.replaceState(null, "", pathFor(S.lang, path));
}
