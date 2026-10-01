// The window manager: dwm's master/stack tiling, monocle and floating, one layout per tag.
import { S, el, type Layout, type Win } from "./core";
import { renderBar } from "./bar";

type Renderer = (body: HTMLDivElement, w: Win) => void;

const renderers: Record<string, Renderer> = {};
let desk: HTMLDivElement;

export function setDesk(node: HTMLDivElement): void
{
        desk = node;
}

export function register(kind: string, render: Renderer): void
{
        renderers[kind] = render;
}

export function narrow(): boolean
{
        return desk.clientWidth < 700;
}

export function spawn(kind: string, tag: number, data: string | null = null, front = false): Win
{
        const node = el("div", "win");
        const grip = el("div", "grip");
        const body = el("div", "wbody");
        node.append(grip, body);
        const w: Win = { id: ++S.seq, kind, tag, node, body, data, fx: 0, fy: 0, fw: 0, fh: 0, title: () => kind };
        const render = renderers[kind];
        if (!render)
        {
                throw new Error("No window type " + kind);
        }
        render(body, w);
        node.addEventListener("mousedown", () =>
        {
                if (S.focused[w.tag] !== w)
                {
                        focus(w);
                }
        });
        node.addEventListener("focusin", () =>
        {
                if (S.focused[w.tag] !== w)
                {
                        focus(w);
                }
        });
        grip.addEventListener("pointerdown", (e) => dragStart(e, w, grip));
        desk.append(node);
        if (front)
        {
                S.wins.unshift(w);
        }
        else
        {
                S.wins.push(w);
        }
        return w;
}

export function kill(w: Win | undefined): void
{
        if (!w)
        {
                return;
        }
        w.onClose?.();
        w.node.remove();
        S.wins = S.wins.filter((x) => x !== w);
        if (S.focused[w.tag] === w)
        {
                S.focused[w.tag] = S.wins.find((x) => x.tag === w.tag);
        }
        view(S.tag);
}

export function visible(): Win[]
{
        return S.wins.filter((w) => w.tag === S.tag);
}

export function focus(w: Win | undefined): void
{
        if (!w)
        {
                return;
        }
        S.focused[w.tag] = w;
        for (const x of S.wins)
        {
                x.node.classList.toggle("focus", x === w);
        }
        arrange();
        w.onFocus?.();
}

export function view(tag: number): void
{
        S.tag = tag;
        const vis = visible();
        const f = S.focused[tag];
        if (!f || f.tag !== tag)
        {
                S.focused[tag] = vis[0];
        }
        for (const x of S.wins)
        {
                x.node.classList.toggle("focus", x === S.focused[tag]);
        }
        arrange();
        S.focused[tag]?.onFocus?.();
}

export function nextTag(): void
{
        for (let i = 1; i <= 9; i++)
        {
                const tag = (S.tag + i - 1) % 9 + 1;
                if (S.wins.some((w) => w.tag === tag))
                {
                        view(tag);
                        return;
                }
        }
}

function place(w: Win, x: number, y: number, width: number, height: number): void
{
        const s = w.node.style;
        s.left = Math.round(x) + "px";
        s.top = Math.round(y) + "px";
        s.width = Math.max(160, Math.round(width)) + "px";
        s.height = Math.max(110, Math.round(height)) + "px";
}

export function layoutOf(tag: number): Layout
{
        return S.layouts[tag] ?? "tile";
}

export function effLayout(): Layout
{
        const l = layoutOf(S.tag);
        return narrow() && l !== "float" ? "mono" : l;
}

export function arrange(): void
{
        if (!desk)
        {
                return;
        }
        const vis = visible();
        const width = desk.clientWidth;
        const height = desk.clientHeight;
        const gap = 6;
        const lay = effLayout();
        const f = S.focused[S.tag];
        desk.parentElement?.classList.toggle("floating", lay === "float");
        for (const w of S.wins)
        {
                w.node.hidden = w.tag !== S.tag;
        }
        if (lay === "mono")
        {
                for (const w of vis)
                {
                        w.node.hidden = w !== f;
                        place(w, gap, gap, width - 2 * gap, height - 2 * gap);
                }
        }
        else if (lay === "tile")
        {
                const n = vis.length;
                const master = n > 1 ? (width - 3 * gap) * 0.58 : width - 2 * gap;
                vis.forEach((w, i) =>
                {
                        if (i === 0)
                        {
                                place(w, gap, gap, master, height - 2 * gap);
                                return;
                        }
                        const h = (height - 2 * gap - gap * (n - 2)) / (n - 1);
                        place(w, 2 * gap + master, gap + (i - 1) * (h + gap), width - 3 * gap - master, h);
                });
        }
        else
        {
                vis.forEach((w, i) =>
                {
                        if (!w.fw)
                        {
                                w.fw = Math.min(760, width - 40);
                                w.fh = Math.min(460, height - 40);
                                w.fx = Math.max(10, Math.min(40 + i * 70, width - w.fw - 10));
                                w.fy = Math.max(10, Math.min(30 + i * 50, height - w.fh - 10));
                        }
                        place(w, w.fx, w.fy, w.fw, w.fh);
                });
        }
        for (const w of vis)
        {
                w.node.style.zIndex = w === f ? "3" : "1";
        }
        renderBar();
}

export function zoom(): void
{
        const f = S.focused[S.tag];
        if (!f)
        {
                return;
        }
        S.wins = [f, ...S.wins.filter((w) => w !== f)];
        arrange();
}

export function step(dir: number): void
{
        const vis = visible();
        if (vis.length < 2)
        {
                return;
        }
        const i = vis.indexOf(S.focused[S.tag] as Win);
        focus(vis[(i + dir + vis.length) % vis.length]);
}

export function setLayout(l: Layout): void
{
        S.layouts[S.tag] = l;
        arrange();
}

export function cycleLayout(): void
{
        const order: Layout[] = ["tile", "mono", "float"];
        setLayout(order[(order.indexOf(layoutOf(S.tag)) + 1) % order.length] as Layout);
}

function dragStart(e: PointerEvent, w: Win, grip: HTMLDivElement): void
{
        if (effLayout() !== "float" || e.button !== 0)
        {
                return;
        }
        e.preventDefault();
        const sx = e.clientX;
        const sy = e.clientY;
        const ox = w.fx;
        const oy = w.fy;
        grip.setPointerCapture(e.pointerId);
        focus(w);
        const move = (ev: PointerEvent): void =>
        {
                w.fx = ox + ev.clientX - sx;
                w.fy = oy + ev.clientY - sy;
                place(w, w.fx, w.fy, w.fw, w.fh);
        };
        const up = (): void =>
        {
                grip.removeEventListener("pointermove", move);
                grip.removeEventListener("pointerup", up);
        };
        grip.addEventListener("pointermove", move);
        grip.addEventListener("pointerup", up);
}

export function openSingle(kind: string, tag: number): Win
{
        const w = S.wins.find((x) => x.kind === kind) ?? spawn(kind, tag);
        view(w.tag);
        focus(w);
        return w;
}

export function openProject(repo: string | null, section?: string): Win
{
        const w = openSingle("nvim", 2);
        if (repo)
        {
                w.open?.(repo, section);
        }
        else
        {
                w.home?.();
        }
        return w;
}

export function spawnTerm(): void
{
        const w = spawn("zsh", S.tag, null, true);
        focus(w);
}
