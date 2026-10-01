// Things that pop up over the desktop: dunst notifications, a blue screen, a reboot, the Konami code.
import { S, el, reducedMotion } from "./core";
import { esc } from "../../lib/esc";

let os: HTMLDivElement;
let dunstWrap: HTMLDivElement | null = null;

export function setOs(node: HTMLDivElement): void
{
        os = node;
}

export function notify(title: string, body?: string): void
{
        if (!dunstWrap || !dunstWrap.isConnected)
        {
                dunstWrap = el("div", "dunst-wrap");
                dunstWrap.setAttribute("role", "status");
                os.append(dunstWrap);
        }
        const n = el("div", "dunst");
        n.innerHTML = "<b>" + esc(title) + "</b>" + (body ? "<br>" + esc(body) : "");
        n.addEventListener("click", () => n.remove());
        dunstWrap.append(n);
        setTimeout(() => n.remove(), 5000);
}

export function bsod(): void
{
        const o = el("div", "bsod");
        o.setAttribute("role", "alert");
        o.innerHTML = "<div class=\"face\">:(</div><p>Your PC ran into a problem and needs to restart. We're just collecting some error info, and then we'll restart for you.</p><p class=\"pct\">0% complete</p><small>Stop code: WINDOWS_IS_NOT_ARCH</small>";
        os.append(o);
        const pct = o.querySelector(".pct") as HTMLParagraphElement;
        let n = 0;
        const timer = setInterval(() =>
        {
                n = Math.min(100, n + (reducedMotion() ? 100 : Math.ceil(Math.random() * 9)));
                pct.textContent = n + "% complete";
                if (n >= 100)
                {
                        clearInterval(timer);
                        pct.textContent = S.lang === "pl" ? "Żartowałem. To Arch Linux (btw). Kliknij, żeby wrócić." : "Just kidding. This is Arch Linux, btw. Click to go back.";
                }
        }, 160);
        o.addEventListener("click", () =>
        {
                clearInterval(timer);
                o.remove();
        });
}

export function reboot(done: () => void): void
{
        const o = el("div", "tty");
        o.setAttribute("aria-hidden", "true");
        os.append(o);
        const ok = "[  <span class=\"ok\">OK</span>  ] ";
        const lines = [
                ok + "Stopped target <b>Graphical Interface</b>.",
                ok + "Stopped <b>dwm</b>.",
                ok + "Stopped target <b>Multi-User System</b>.",
                ok + "Unmounted <b>/mnt/windows</b> (it was never mounted).",
                ok + "Reached target <b>System Reboot</b>.",
                "",
                "Arch Linux (tty1)",
                "",
                "arch login: nox",
                "Password:",
                "[nox@arch ~]$ startx"
        ];
        let i = 0;
        let finished = false;
        const finish = (): void =>
        {
                if (finished)
                {
                        return;
                }
                finished = true;
                o.remove();
                done();
        };
        o.addEventListener("click", finish);
        const timer = setInterval(() =>
        {
                if (finished || i >= lines.length)
                {
                        clearInterval(timer);
                        setTimeout(finish, 350);
                        return;
                }
                o.innerHTML += lines[i++] + "\n";
        }, reducedMotion() ? 10 : 130);
}

export function watchKonami(): void
{
        const seq = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
        let pos = 0;
        document.addEventListener("keydown", (e) =>
        {
                pos = e.key === seq[pos] ? pos + 1 : (e.key === seq[0] ? 1 : 0);
                if (pos !== seq.length)
                {
                        return;
                }
                pos = 0;
                // keep the b/a out of whatever input had focus
                e.preventDefault();
                const a = document.activeElement;
                if (a instanceof HTMLInputElement && a.value.endsWith("b"))
                {
                        a.value = a.value.slice(0, -1);
                        a.dispatchEvent(new Event("input"));
                }
                notify("Achievement unlocked", S.lang === "pl" ? "↑↑↓↓←→←→BA. C/C++ rządzi!!!" : "↑↑↓↓←→←→BA. C/C++ rules!!!");
        }, true);
}
