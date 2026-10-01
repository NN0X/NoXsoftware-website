// Boots the desktop over the plain page. If anything here throws, the plain page stays visible.
import type { DesktopData } from "../../data/types";
import { S, el, loadData, store } from "./core";
import { cycleLayout, focus, kill, openProject, openSingle, setDesk, setLayout, spawn, spawnTerm, step, view, zoom, arrange } from "./wm";
import { enableUrlSync, loadWeather, renderHint, setBarNodes, setLang, tick } from "./bar";
import { openLauncher, setLauncherHost } from "./dmenu";
import { setOs, watchKonami } from "./fx";
import "./windows/zsh";
import "./windows/htop";
import "./windows/nvim";
import "./windows/firefox";

declare global
{
        interface Window
        {
                noxBooted?: boolean;
        }
}

function bindKeys(): void
{
        document.addEventListener("keydown", (e) =>
        {
                if (!e.altKey || e.ctrlKey || e.metaKey)
                {
                        return;
                }
                const c = e.code;
                if (/^Digit[1-9]$/.test(c))
                {
                        view(Number(c.slice(5)));
                }
                else if (c === "KeyJ")
                {
                        step(1);
                }
                else if (c === "KeyK")
                {
                        step(-1);
                }
                else if (c === "KeyP")
                {
                        openLauncher();
                }
                else if (c === "Enter" && e.shiftKey)
                {
                        spawnTerm();
                }
                else if (c === "Enter")
                {
                        zoom();
                }
                else if (c === "KeyC" && e.shiftKey)
                {
                        kill(S.focused[S.tag]);
                }
                else if (c === "KeyT")
                {
                        setLayout("tile");
                }
                else if (c === "KeyM")
                {
                        setLayout("mono");
                }
                else if (c === "KeyF")
                {
                        setLayout("float");
                }
                else if (c === "Space")
                {
                        cycleLayout();
                }
                else
                {
                        return;
                }
                e.preventDefault();
        });
}

// The plain pages carry a hidden "open the desktop" button for visitors who switched to them.
function bindPlainToggle(): void
{
        for (const b of document.querySelectorAll<HTMLButtonElement>("[data-to-desktop]"))
        {
                b.hidden = false;
                b.addEventListener("click", () =>
                {
                        store("nox-plain", "0");
                        location.href = location.pathname;
                });
        }
}

export function boot(): void
{
        bindPlainToggle();
        if (!document.documentElement.classList.contains("desktop"))
        {
                return;
        }
        try
        {
                const raw = document.getElementById("nox-data")?.textContent;
                const os = document.getElementById("os") as HTMLDivElement | null;
                if (!raw || !os)
                {
                        throw new Error("desktop data missing");
                }
                const data = JSON.parse(raw) as DesktopData;
                loadData(data);
                S.lang = data.lang;

                const bar = el("div");
                const desk = el("div", "desk");
                const hint = el("div", "hint");
                os.replaceChildren(bar, desk, hint);
                setOs(os);
                setDesk(desk);
                setBarNodes(bar, hint);
                setLauncherHost(os);
                os.hidden = false;

                const term = spawn("zsh", 1);
                spawn("htop", 1);
                spawn("nvim", 2);
                spawn("firefox", 9);
                S.focused[1] = term;
                renderHint();
                bindKeys();
                watchKonami();

                if (data.open)
                {
                        openProject(data.open);
                }
                else if (data.focus === "htop")
                {
                        openSingle("htop", 1);
                }
                else
                {
                        view(1);
                        focus(term);
                }
                enableUrlSync();
                // /pl/... is always Polish. Elsewhere a remembered choice, or a Polish browser, wins.
                const saved = store("nox-lang");
                const preferred = saved === "pl" || saved === "en" ? saved : (navigator.language.toLowerCase().startsWith("pl") ? "pl" : "en");
                if (data.lang === "en" && preferred === "pl")
                {
                        setLang("pl", true);
                }
                setInterval(tick, 1000);
                new ResizeObserver(() => arrange()).observe(desk);
                void loadWeather();
                window.noxBooted = true;
        }
        catch (err)
        {
                console.error("Desktop failed to start, showing the plain page instead.", err);
                document.documentElement.classList.remove("desktop");
        }
}
