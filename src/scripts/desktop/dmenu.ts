// dmenu: a filter-as-you-type launcher drawn over the bar.
import { FEATURED, REPOS, el, nameOf } from "./core";
import { openProject, openSingle, spawnTerm } from "./wm";

let launcher: HTMLDivElement | null = null;
let os: HTMLDivElement;

export function setLauncherHost(node: HTMLDivElement): void
{
        os = node;
}

export function launcherOpen(): boolean
{
        return launcher !== null;
}

export function closeLauncher(): void
{
        launcher?.remove();
        launcher = null;
}

export function openLauncher(): void
{
        closeLauncher();
        const featured = FEATURED.map((p) => p.repo);
        const entries: [string, () => void][] = [
                ...featured.map((r): [string, () => void] => [nameOf(r).toLowerCase(), () => openProject(r)]),
                ["zsh", spawnTerm],
                ["htop", () => openSingle("htop", 1)],
                ["nvim", () => openProject(null)],
                ["firefox", () => openSingle("firefox", 9)],
                ...Object.keys(REPOS).filter((r) => !featured.includes(r)).map((r): [string, () => void] => [r, () => openProject(r)])
        ];
        let sel = 0;
        const box = el("div", "dmenu");
        box.setAttribute("role", "dialog");
        box.setAttribute("aria-label", "dmenu");
        const input = el("input");
        input.id = "dmenu-in";
        input.setAttribute("aria-label", "dmenu: type to filter, Enter to open");
        input.autocomplete = "off";
        input.spellcheck = false;
        const items = el("div", "items");
        box.append(input, items);
        os.append(box);
        launcher = box;

        const matches = (): [string, () => void][] => entries.filter((e) => e[0].toLowerCase().includes(input.value.toLowerCase()));
        const draw = (): void =>
        {
                const m = matches();
                sel = Math.min(sel, Math.max(0, m.length - 1));
                items.replaceChildren(...m.map(([label, run], i) =>
                {
                        const b = el("button", i === sel ? "sel" : "", label);
                        b.type = "button";
                        b.addEventListener("mousedown", (ev) => ev.preventDefault());
                        b.addEventListener("click", () =>
                        {
                                closeLauncher();
                                run();
                        });
                        return b;
                }));
        };
        input.addEventListener("input", () =>
        {
                sel = 0;
                draw();
        });
        input.addEventListener("keydown", (e) =>
        {
                const m = matches();
                if (e.key === "Escape")
                {
                        closeLauncher();
                }
                else if (e.key === "Enter" && m[sel])
                {
                        const run = m[sel]![1];
                        closeLauncher();
                        run();
                }
                else if (e.key === "ArrowRight" || e.key === "ArrowDown" || (e.key === "Tab" && !e.shiftKey))
                {
                        sel = Math.min(m.length - 1, sel + 1);
                        draw();
                }
                else if (e.key === "ArrowLeft" || e.key === "ArrowUp" || (e.key === "Tab" && e.shiftKey))
                {
                        sel = Math.max(0, sel - 1);
                        draw();
                }
                else
                {
                        return;
                }
                e.preventDefault();
        });
        input.addEventListener("blur", () => setTimeout(() =>
        {
                if (launcher && document.activeElement !== input)
                {
                        closeLauncher();
                }
        }, 120));
        draw();
        input.focus();
}
