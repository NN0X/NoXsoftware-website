// st running zsh with oh-my-zsh: robbyrussell prompt, git plugin, zsh-syntax-highlighting,
// zsh-autosuggestions, menu completion, history substring search, setopt autocd correct.
import { FEATURED, REPOS, S, data, el, findRepo, meta, nameOf, reducedMotion, t, type Win } from "../core";
import { kill, openProject, openSingle, register, setLayout, step, view, zoom } from "../wm";
import { renderBar, setLang } from "../bar";
import { launcherOpen } from "../dmenu";
import { bsod, reboot } from "../fx";
import { isDir, isFile, listDir, repoOfDir, resolve } from "../fs";
import { esc } from "../../../lib/esc";
import { lev } from "../../../lib/lev";
import { loadBrutus, tokenize } from "../demos";
import { BRUTUS_MIN_KEY } from "../../../lib/cicero";
import { MAN_PAGE, type StringKey } from "../../../lib/i18n";

type Command = (args: string[]) => number | void;

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

const FORTUNES: [string, string][] = [
        ["C/C++ rules!!!", "NoXsoftware-website/README.md"],
        ["Brutus should not be trusted.", "Brutus-Encryption/README.md"],
        ["major fix to driver ratings computations. Fangio is the GOAT", "F1Ratings@9d64dcf"],
        ["final hotfixes i hope", "Programmar@b8a05a8"],
        ["hothotfixes", "Programmar@caf2dd0"],
        ["Emails and messages containing links will be discarded!", "NN0X/README.md"],
        ["No idea why somebody would use website specifically created by me for me.", "NoXsoftware-website/README.md"],
        ["Merge pull request #4 from NN0X/fixing-indent-hell", "CiceroTokenizer"]
];

const DOCTOR: [RegExp, string[]][] = [
        [/\b(windows|microsoft)\b/i, ["Why do you say {0}? Have you considered Arch?", "Does {0} make you feel trapped?"]],
        [/\b(arch|linux|dwm)\b/i, ["I see you have good taste. Go on.", "And how does {0} make you feel?"]],
        [/\b(vim|nvim|neovim)\b/i, ["Is it because you could not exit {0} that you came to me?"]],
        [/\bemacs\b/i, ["We do not speak that name in this house."]],
        [/\b(vs ?code|vscode)\b/i, ["How long have you been using a web browser to edit text?", "And does {0} make you feel productive, or just busy?"]],
        [/\bpython\b/i, ["Have you tried C++?"]],
        [/\bi am (.+)/i, ["Why do you say you are {1}?", "How long have you been {1}?"]],
        [/\bi feel (.+)/i, ["Do you often feel {1}?"]],
        [/\?$/, ["Why do you ask?", "What answer would please you most?"]]
];
const DOCTOR_DEFAULT = ["Can you elaborate on that?", "Why do you say that?", "I would appreciate it if you would continue.", "What makes you believe that?"];

const ALIASES: Record<string, string> = {
        "..": "cd ..", "...": "cd ../..", "l": "ls -la", "la": "ls -a", "ll": "ls -la", "gst": "git status", "glog": "git log",
        "please": "sudo", "vim": "nvim", "vi": "nvim", "python3": "python", "g++": "gcc", "clang++": "clang", "fastfetch": "neofetch"
};

const DESCRIPTIONS: Record<string, StringKey> = {
        help: "h.ls", ls: "h.ls", cd: "h.cd", open: "h.open", nvim: "h.open", htop: "h.htop", man: "h.man", git: "h.git", firefox: "h.ff",
        setxkbmap: "h.lang", fortune: "h.fun", cowsay: "h.fun", sl: "h.fun", neofetch: "h.classic", clear: "h.classic", mail: "h.contact",
        cicero: "h.demo", brutus: "h.demo", dwmc: "h.dwmc", f1ratings: "h.f1"
};

// Commands that should stay a surprise: no completion, no listing.
const HIDDEN = new Set(["Hyprland", "hyprland", "win", "windows", "explorer.exe", "cmd.exe", "powershell", "regedit", "windows.exe", "winget", "choco", "scoop", "apt", "apt-get", "edge", "msedge", "wsl", "butterfly", "doctor", "M-x", "emacs", "code", "vscode", "codium", "nano", "bash", "chsh", "reboot", "shutdown", "poweroff", "systemctl", "yay", "pacman", "startx", "sudo", "rm", "id", "hostname", "uname", "whoami", "which", "printf", "export", "ping", "make", "gcc", "clang", "python", ":q"]);

function render(body: HTMLDivElement, w: Win): void
{
        body.classList.add("term");
        const out = el("div", "out");
        const line = el("div", "pl");
        const ps = el("span", "ps");
        const editor = el("div", "ed");
        const hl = el("div", "hl");
        hl.setAttribute("aria-hidden", "true");
        const input = el("input");
        input.id = "zsh-" + w.id;
        input.setAttribute("aria-label", "zsh: type a command, try help");
        input.autocomplete = "off";
        input.spellcheck = false;
        editor.append(hl, input);
        line.append(ps, editor);
        const menuEl = el("div", "menu");
        menuEl.hidden = true;
        body.append(out, line, menuEl);

        let cwd = "~";
        let prevCwd = "~";
        let status = 0;
        // ~/.zsh_history from "an earlier session", so autosuggestions have something to offer
        const hist = ["neofetch", "man nox", "open sulla", "htop", "git log", "fortune"];
        let hi = hist.length;
        let navPrefix: string | null = null;
        let menu: { head: string; items: [string, string][]; idx: number; base: string } | null = null;
        let pending: { line: HTMLDivElement; keys: string; cb: (k: string) => void } | null = null;
        let busy = false;
        let mode: "doctor" | null = null;
        let emacsTries = 0;
        let codeTries = 0;

        w.title = () => "st: zsh " + cwd;

        const res = (p?: string): string => resolve(cwd, prevCwd, REPOS, p);
        const dir = (d: string): boolean => isDir(d, REPOS);
        const repoHere = (): string | null => repoOfDir(cwd, REPOS);

        function prompt(): string
        {
                if (mode === "doctor")
                {
                        return "<span class=\"p b\">doctor&gt;</span> ";
                }
                const base = cwd === "~" ? "~" : cwd.split("/").pop() ?? "~";
                let p = "<span class=\"" + (status === 0 ? "g" : "r") + " b\">➜</span>  <span class=\"c b\">" + esc(base) + "</span> ";
                const repo = repoHere();
                if (repo)
                {
                        p += "<span class=\"bl b\">git:(</span><span class=\"r b\">" + esc(REPOS[repo]?.branch ?? "master") + "</span><span class=\"bl b\">)</span> ";
                }
                return p;
        }

        function drawPrompt(): void
        {
                ps.innerHTML = prompt();
                paint();
        }

        function print(html: string, cls = ""): HTMLDivElement
        {
                const d = el("div", cls);
                d.innerHTML = html;
                out.append(d);
                return d;
        }

        function scroll(): void
        {
                body.scrollTop = body.scrollHeight;
        }

        function runBtn(label: string, cmd: string, cls = ""): string
        {
                return "<button type=\"button\" class=\"run" + (cls ? " " + cls : "") + "\" data-cmd=\"" + esc(cmd) + "\">" + esc(label) + "</button>";
        }

        function entry(d: string, f: string): string
        {
                const isTree = f.endsWith("/");
                let cmd: string | null = null;
                const repo = d.match(/^~\/projects\/([^/]+)$/)?.[1];
                if (d === "~/projects")
                {
                        cmd = "open " + nameOf(f.slice(0, -1)).toLowerCase();
                }
                else if (d === "~/.eggs")
                {
                        cmd = "firefox noxsoftware.pl/" + f;
                }
                else if (repo)
                {
                        const ex = REPOS[repo]?.excerpt;
                        if (f === "README.md")
                        {
                                cmd = "open " + nameOf(repo).toLowerCase();
                        }
                        else if (ex && ex.path.split("/")[0] + "/" === f)
                        {
                                cmd = "open " + nameOf(repo).toLowerCase() + " code";
                        }
                }
                else
                {
                        cmd = isTree ? "cd " + f : "cat " + f;
                }
                if (!cmd)
                {
                        return isTree ? "<span class=\"bl b\">" + esc(f) + "</span>" : esc(f);
                }
                return runBtn(f, cmd, isTree ? "dir" : "");
        }

        function windowsMount(p?: string): boolean
        {
                if (/^\/mnt\/(windows|c|win)/i.test(p ?? ""))
                {
                        print(esc(p) + ": not mounted. as it should be. <span class=\"f\"># see Arch-Utility-Scripts/mount_windows_system.sh</span>", "y");
                        return true;
                }
                return false;
        }

        function neofetch(): void
        {
                const wrap = el("div", "neo");
                wrap.append(el("pre", "", ASCII.join("\n")));
                const dl = el("dl");
                const head = el("dd", "hd");
                head.innerHTML = "<span class=\"p b\">nox</span>@<span class=\"p b\">noxsoftware.pl</span><br><span class=\"f\">-------------------</span>";
                dl.append(head);
                const rows: [string, string][] = [["OS", "Arch Linux (btw)"], ["WM", "dwm"], ["Terminal", "st"], ["Shell", "zsh + oh-my-zsh"], ["Editor", "neovim"], ["Font", "Ubuntu Mono"], ["Locale", S.lang === "pl" ? "pl_PL.UTF-8" : "en_US.UTF-8"], ["Braces", "Allman, 8 spaces"], ["Langs", "C, C++"], ["Repos", Object.keys(REPOS).length + " public"], ["Served by", "Raspberry Pi · Apache2 · Cloudflare"]];
                for (const [k, v] of rows)
                {
                        dl.append(el("dt", "", k), el("dd", "", v));
                }
                const pal = el("div", "pal");
                for (const c of ["#120e18", "#f48a93", "#9bdca9", "#f0cd86", "#98b9f9", "#c6a4ff", "#8fdede", "#ece6f4"])
                {
                        const i = el("i");
                        i.style.background = c;
                        pal.append(i);
                }
                dl.append(pal);
                wrap.append(dl);
                out.append(wrap);
        }

        function ls(args: string[]): number
        {
                const all = args.some((a) => /^-\w*a/.test(a));
                const target = args.find((a) => !a.startsWith("-"));
                if (windowsMount(target))
                {
                        return 2;
                }
                const d = target ? res(target) : cwd;
                if (!dir(d))
                {
                        print("ls: cannot access '" + esc(target) + "': No such file or directory", "r");
                        return 2;
                }
                print(listDir(d, REPOS).filter((f) => all || !f.startsWith(".")).map((f) => entry(d, f)).join("  "));
                return 0;
        }

        function cd(target?: string): number
        {
                if (windowsMount(target))
                {
                        return 1;
                }
                const d = res(target);
                if (!dir(d))
                {
                        print("cd: no such file or directory: " + esc(target), "r");
                        return 1;
                }
                prevCwd = cwd;
                cwd = d;
                return 0;
        }

        function train(): void
        {
                const track = el("div", "sl-track");
                const pre = el("pre", "", "      ====        ________\n  _D _|  |_______/        \\__I_I_____===__\n   |(_)---  |   H\\________/ |   |        =\n   /     |  |   H  |  |     |   |  NOX   \n  |      |  |   H  |__--------------------\n__/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___\n |/-=|___|=    ||    ||    ||    |_____/~\n  \\_/      \\O=====O=====O=====O_/      \\_/");
                track.append(pre);
                out.append(track);
                if (reducedMotion())
                {
                        pre.style.left = "0";
                }
                else
                {
                        pre.addEventListener("animationend", () => track.remove());
                }
        }

        function notArch(cmd: string): number
        {
                print("zsh: command not found: " + esc(cmd) + "\n<span class=\"f\"># this is Arch. try pacman, or yay for the AUR.</span>", "r");
                return 127;
        }

        function ask(node: HTMLDivElement, keys: string, cb: (k: string) => void): void
        {
                pending = { line: node, keys, cb };
                ps.innerHTML = "";
                input.value = "";
                paint();
                scroll();
        }

        function answer(k: string): void
        {
                const p = pending;
                if (!p)
                {
                        return;
                }
                pending = null;
                p.line.append(k);
                p.cb(k);
                if (!pending && !busy)
                {
                        drawPrompt();
                }
                scroll();
        }

        function butterfly(): number
        {
                ask(print("Do you really want to unleash the powers of the butterfly? (y or n) "), "yn", (k) =>
                {
                        if (k !== "y")
                        {
                                print("Quit");
                                return;
                        }
                        busy = true;
                        print("Amazing physics going on...");
                        const art = el("pre", "p");
                        out.append(art);
                        const open = "   __     __\n  /  \\   /  \\\n  \\   \\ /   /\n   >   (   <\n  /   / \\   \\\n  \\__/   \\__/";
                        const shut = "      | |\n     /| |\\\n     \\| |/\n      ) (\n     /| |\\\n     \\| |/";
                        let n = 0;
                        const timer = setInterval(() =>
                        {
                                art.textContent = n % 2 ? shut : open;
                                scroll();
                                if (++n > (reducedMotion() ? 1 : 9))
                                {
                                        clearInterval(timer);
                                        art.textContent = open;
                                        print("Successfully flipped one bit!", "g");
                                        busy = false;
                                        drawPrompt();
                                        scroll();
                                }
                        }, 260);
                });
                return 0;
        }

        function doctorReply(text: string): void
        {
                if (/^(bye|quit|exit|goodbye)\b/i.test(text))
                {
                        mode = null;
                        print("Goodbye. Try nvim, it helps.", "p");
                        return;
                }
                let reply: string | null = null;
                for (const [re, options] of DOCTOR)
                {
                        const m = text.match(re);
                        if (m)
                        {
                                const pick = options[Math.floor(Math.random() * options.length)] ?? "";
                                reply = pick.replace("{0}", m[0]).replace("{1}", (m[1] ?? "").replace(/[.!]+$/, ""));
                                break;
                        }
                }
                print(esc(reply ?? DOCTOR_DEFAULT[Math.floor(Math.random() * DOCTOR_DEFAULT.length)]), "p");
        }

        const CMDS: Record<string, Command> = {
                help: () =>
                {
                        print("<span class=\"b\">" + esc(t("help.title")) + "</span>");
                        const rows: [string, StringKey][] = [["ls", "h.ls"], ["projects", "h.cd"], ["open sulla", "h.open"], ["open cicero demo", "h.sec"], ["cicero great product", "h.demo"], ["brutus et-tu do not trust me", "h.demo"], ["htop", "h.htop"], ["firefox noxsoftware.pl", "h.ff"], ["man nox", "h.man"], ["mail", "h.contact"], ["git log", "h.git"], [S.lang === "pl" ? "setxkbmap us" : "setxkbmap pl", "h.lang"], ["dwmc setlayout monocle", "h.dwmc"], ["fortune", "h.fun"], ["cowsay", "h.fun"], ["sl", "h.fun"], ["neofetch", "h.classic"], ["clear", "h.classic"]];
                        print(rows.map(([c, d]) => "  " + runBtn(c, c) + " ".repeat(Math.max(2, 32 - c.length)) + "<span class=\"d\">" + esc(t(d)) + "</span>").join("\n"));
                        print(esc(t("h.secret")), "f");
                },
                ls,
                cd: (a) => cd(a[0]),
                pwd: () => void print(esc(cwd.replace("~", "/home/nox"))),
                cat: (a) =>
                {
                        const f = a[0] ?? "";
                        const full = res(f);
                        const inRepo = full.match(/^~\/projects\/([^/]+)\/(.+)$/);
                        if (inRepo && inRepo[1] && REPOS[inRepo[1]])
                        {
                                const repo = inRepo[1];
                                if (/README/i.test(inRepo[2] ?? ""))
                                {
                                        openProject(repo, "readme");
                                        return 0;
                                }
                                if (REPOS[repo]?.excerpt?.path === inRepo[2])
                                {
                                        openProject(repo, "code");
                                        return 0;
                                }
                        }
                        if (f === "/etc/os-release")
                        {
                                print("NAME=\"Arch Linux\"\nPRETTY_NAME=\"Arch Linux\"\nID=arch\nBUILD_ID=rolling\nANSI_COLOR=\"38;2;23;147;209\"\nHOME_URL=\"https://archlinux.org/\"\nLOGO=archlinux-logo <span class=\"f\"># btw</span>");
                                return 0;
                        }
                        if (full === "~/contact.txt")
                        {
                                print("<span class=\"y\">mail</span>      nox@noxsoftware.pl\n<span class=\"y\">github</span>    <a href=\"https://github.com/NN0X\">github.com/NN0X</a>\n<span class=\"y\">linkedin</span>  <a href=\"https://linkedin.com/in/tomasz-sarkowicz\">in/tomasz-sarkowicz</a>\n<span class=\"f\"># messages containing links are discarded</span>");
                                return 0;
                        }
                        if (full === "~/README.md")
                        {
                                print("<span class=\"p b\"># NoXsoftware.pl</span>\nMy personal self-hosted website.\nBasically I have a domain and possibility to self-host so I created a website\nfor showcasing my projects. This is also a good opportunity to learn some web\ndevelopment. <span class=\"y\">But still C/C++ rules!!!</span>");
                                return 0;
                        }
                        if (full === "~/.zshrc")
                        {
                                print("<span class=\"f\"># ~/.zshrc (website edition)</span>\n<span class=\"p\">export</span> ZSH=<span class=\"g\">\"$HOME/.oh-my-zsh\"</span>\nZSH_THEME=<span class=\"g\">\"robbyrussell\"</span>\nplugins=(git zsh-autosuggestions zsh-syntax-highlighting)\n<span class=\"p\">setopt</span> autocd correct\n<span class=\"p\">export</span> EDITOR=nvim\n<span class=\"p\">alias</span> vim=<span class=\"g\">'nvim'</span>\n<span class=\"p\">alias</span> python=<span class=\"g\">'echo \"have you tried C++?\"'</span>");
                                return 0;
                        }
                        if (full.startsWith("~/.eggs/") && isFile(full, REPOS))
                        {
                                print("→ " + runBtn("noxsoftware.pl/" + full.slice(8), "firefox noxsoftware.pl/" + full.slice(8)) + " <span class=\"f\">(meme page kept from the old site)</span>");
                                return 0;
                        }
                        print("cat: " + esc(f) + ": " + (dir(full) ? "Is a directory" : "No such file or directory"), "r");
                        return 1;
                },
                open: (a) =>
                {
                        const here = repoHere();
                        const repo = findRepo(a[0]) ?? (here && (!a[0] || a[0] === ".") ? here : undefined);
                        if (!repo)
                        {
                                print("open: no project matches '" + esc(a[0] ?? "") + "'. try: " + runBtn("ls ~/projects", "ls ~/projects"), "r");
                                return 1;
                        }
                        const sections: Record<string, string> = { readme: "readme", code: "code", src: "code", log: "log", git: "log", demo: "demo" };
                        openProject(repo, sections[(a[1] ?? "").toLowerCase()]);
                        return 0;
                },
                nvim: (a) =>
                {
                        if (!a[0])
                        {
                                openProject(repoHere());
                                return 0;
                        }
                        return CMDS.open!(a);
                },
                htop: () => void openSingle("htop", 1),
                firefox: (a) =>
                {
                        const ff = openSingle("firefox", 9);
                        if (a.length)
                        {
                                ff.go?.(a.join(" "));
                        }
                },
                f1ratings: () =>
                {
                        print(esc(t("f1.soon")), "y");
                        openProject("F1Ratings");
                },
                mail: () => void print("mail: compose in your own client → <a href=\"mailto:nox@noxsoftware.pl\">nox@noxsoftware.pl</a>\n<span class=\"f\"># plain text please; messages containing links are discarded</span>"),
                cicero: (a) =>
                {
                        const text = a.join(" ").replace(/^["']|["']$/g, "");
                        if (!text)
                        {
                                print("usage: cicero &lt;text&gt;   e.g. " + runBtn("cicero great product", "cicero great product"));
                                return 1;
                        }
                        const out = print(esc(t("demo.loading", { f: "cicero.wasm" })), "f");
                        tokenize(text).then((r) =>
                        {
                                out.className = "";
                                out.innerHTML = r.pieces.map((piece, i) => "<span class=\"tk\">" + esc(piece.replace(/ /g, "·")) + "<sub>" + r.ids[i] + "</sub></span>").join("")
                                        + "\n<span class=\"f\">" + esc(t("demo.tokens", { n: r.ids.length, c: text.length, d: r.size })) + "</span>"
                                        + (r.dropped.length ? "\n<span class=\"y\">" + esc(t("demo.dropped", { c: r.dropped.join(" ") })) + "</span>" : "");
                                scroll();
                        }).catch((err: Error) =>
                        {
                                out.className = "r";
                                out.textContent = t("demo.failed", { e: err.message });
                        });
                },
                brutus: (a) =>
                {
                        if (a.length < 2)
                        {
                                print("usage: brutus &lt;key&gt; &lt;text&gt;   e.g. " + runBtn("brutus et-tu do not trust me", "brutus et-tu do not trust me"));
                                return 1;
                        }
                        const key = a[0] ?? "";
                        if (key.length < BRUTUS_MIN_KEY)
                        {
                                print(esc(t("demo.keyShort", { n: BRUTUS_MIN_KEY })), "r");
                                return 1;
                        }
                        const text = a.slice(1).join(" ");
                        const out = print(esc(t("demo.loading", { f: "brutus.wasm" })), "f");
                        loadBrutus().then((encrypt) =>
                        {
                                const enc = encrypt(text, key);
                                const bytes = (s: string): number => new TextEncoder().encode(s).length;
                                out.className = "";
                                out.innerHTML = "<span class=\"g\">" + esc(enc) + "</span>\n<span class=\"f\">" + esc(t("demo.ratio", { a: bytes(text), b: bytes(enc) })) + "</span>";
                                scroll();
                        }).catch((err: Error) =>
                        {
                                out.className = "r";
                                out.textContent = t("demo.failed", { e: err.message });
                        });
                },
                dwmc: (a) =>
                {
                        const [c, v = ""] = a;
                        if (c === "view" && /^[1-9]$/.test(v))
                        {
                                view(Number(v));
                        }
                        else if (c === "setlayout" && /^(tile|monocle|float|floating)$/.test(v))
                        {
                                setLayout(v.startsWith("t") ? "tile" : v.startsWith("m") ? "mono" : "float");
                        }
                        else if (c === "killclient")
                        {
                                kill(S.focused[S.tag]);
                        }
                        else if (c === "zoom")
                        {
                                zoom();
                        }
                        else if (c === "focusstack")
                        {
                                step(v === "-1" ? -1 : 1);
                        }
                        else
                        {
                                print("usage: dwmc view &lt;1-9&gt; | setlayout &lt;tile|monocle|floating&gt; | focusstack &lt;+1|-1&gt; | zoom | killclient");
                                return 1;
                        }
                },
                neofetch,
                clear: () => void out.replaceChildren(),
                whoami: () => void print("nox"),
                id: () => void print("uid=1000(nox) gid=1000(nox) groups=1000(nox),998(wheel),1001(c++)"),
                hostname: () => void print("arch"),
                uname: (a) => void print(a.includes("-a") ? "Linux arch x86_64 GNU/Linux <span class=\"f\"># this page is served by a Raspberry Pi though</span>" : "Linux"),
                date: () => void print(esc(new Date().toLocaleString(S.lang === "pl" ? "pl-PL" : "en-GB", { dateStyle: "full", timeStyle: "medium", timeZone: "Europe/Warsaw" }))),
                uptime: () =>
                {
                        const days = Math.floor((Date.now() - Date.parse("2024-07-27T00:00:00Z")) / 86400000);
                        print(" up " + days + " days, 1 user, load average: 0.04, 0.02, 0.00 <span class=\"f\"># since this site's first commit, 2024-07-27</span>");
                },
                history: () => void print(hist.map((h, i) => String(i + 1).padStart(5) + "  " + esc(h)).join("\n")),
                echo: (a) =>
                {
                        const env: Record<string, string> = { "$SHELL": "/usr/bin/zsh", "$0": "zsh", "$EDITOR": "nvim", "$LANG": S.lang === "pl" ? "pl_PL.UTF-8" : "en_US.UTF-8", "$USER": "nox", "$HOME": "/home/nox", "$ZSH_THEME": "robbyrussell", "$?": String(status) };
                        print(esc(a.map((x) => env[x] ?? x.replace(/^["']|["']$/g, "")).join(" ")));
                },
                printf: (a) => void print(esc(a.join(" ").replace(/^["']|["']$/g, "")) + "<span class=\"eol\">%</span>"),
                export: (a) =>
                {
                        const m = (a[0] ?? "").match(/^LANG=(\w\w)/);
                        if (m && (m[1] === "pl" || m[1] === "en"))
                        {
                                setLang(m[1]);
                        }
                },
                setxkbmap: (a) =>
                {
                        const l = (a[0] ?? "").toLowerCase();
                        if (l === "pl")
                        {
                                setLang("pl");
                        }
                        else if (l === "us" || l === "en" || l === "gb")
                        {
                                setLang("en");
                        }
                        else
                        {
                                print("Error loading new keyboard description. try: setxkbmap pl | setxkbmap us", "r");
                                return 1;
                        }
                },
                man: (a) =>
                {
                        if ((a[0] ?? "").toLowerCase() !== "nox")
                        {
                                print(a[0] ? "No manual entry for " + esc(a[0]) : "What manual page do you want?\nFor example, try 'man nox'.");
                                return a[0] ? 16 : 1;
                        }
                        print(MAN_PAGE[S.lang]);
                },
                which: (a) =>
                {
                        const c = a[0] ?? "";
                        if (ALIASES[c])
                        {
                                print(esc(c) + ": aliased to " + esc(ALIASES[c]));
                        }
                        else if (CMDS[c])
                        {
                                print("/usr/bin/" + esc(c));
                        }
                        else
                        {
                                print(esc(c) + " not found", "r");
                                return 1;
                        }
                },
                sudo: (a) =>
                {
                        if (!a.length)
                        {
                                print("usage: sudo command");
                                return 1;
                        }
                        print("[sudo] password for nox: \nnox is not in the sudoers file.  This incident will be reported.", "r");
                        return 1;
                },
                rm: (a) =>
                {
                        const all = a.join(" ");
                        print(all.includes("/") && /-[a-z]*r/.test(all) ? "rm: it is dangerous to operate recursively on '/'\nrm: use --no-preserve-root to override this failsafe" : "rm: refusing. this is a read-only website.", "r");
                        return 1;
                },
                exit: () => kill(w),
                sl: train,
                make: () => void print("clang++ -O3 -Wall -Wextra -Wpedantic -std=c++11 src/*.cpp -o build/release/noxsoftware\n<span class=\"g\">Build complete.</span> Executable is located at build/release/noxsoftware\n<span class=\"f\">0 warnings. (-Wpedantic was asked nicely.)</span>"),
                gcc: () =>
                {
                        print("gcc: fatal error: no input files\ncompilation terminated.", "r");
                        return 1;
                },
                clang: () =>
                {
                        print("clang: error: no input files", "r");
                        return 1;
                },
                python: () => void print("have you tried C++?"),
                nano: () =>
                {
                        print("zsh: command not found: nano. did you mean <span class=\"y\">nvim</span>?", "r");
                        return 127;
                },
                bash: () => void print("you're already in a better shell."),
                chsh: () =>
                {
                        print("chsh: no.", "r");
                        return 1;
                },
                ":q": () =>
                {
                        print("you're not in vim. nice reflex though.", "y");
                        return 1;
                },
                git: (a) =>
                {
                        const repo = repoHere();
                        if (a[0] === "status")
                        {
                                if (!repo)
                                {
                                        print("fatal: not a git repository (or any of the parent directories): .git", "r");
                                        return 128;
                                }
                                const branch = REPOS[repo]?.branch ?? "master";
                                print("On branch " + esc(branch) + "\nYour branch is up to date with 'origin/" + esc(branch) + "'.\n\nnothing to commit, working tree clean");
                                return 0;
                        }
                        if (a[0] !== "log")
                        {
                                print(a[0] ? "git: '" + esc(a[0]) + "' is not a git command here. try: git log, git status" : "usage: git log | git status", a[0] ? "r" : "");
                                return a[0] ? 1 : 0;
                        }
                        const all: [string, string, string, string][] = [];
                        for (const [name, r] of Object.entries(REPOS))
                        {
                                if (!repo || name === repo)
                                {
                                        for (const [hash, date, msg] of r.log)
                                        {
                                                all.push([date, hash, name, msg]);
                                        }
                                }
                        }
                        all.sort((x, y) => y[0].localeCompare(x[0]));
                        print(all.slice(0, 10).map(([date, hash, name, msg]) => "<a class=\"y\" href=\"https://github.com/" + esc(data.user) + "/" + esc(name) + "/commit/" + esc(hash) + "\">" + esc(hash) + "</a> <span class=\"f\">" + esc(date) + "</span> " + (repo ? "" : runBtn(name, "open " + nameOf(name).toLowerCase(), "dir") + ": ") + esc(msg)).join("\n"));
                },
                fortune: () =>
                {
                        const [quote, source] = FORTUNES[Math.floor(Math.random() * FORTUNES.length)] ?? FORTUNES[0]!;
                        print("\"" + esc(quote) + "\"\n        <span class=\"f\">-- " + esc(source) + "</span>");
                },
                cowsay: (a) =>
                {
                        const s = a.join(" ") || "moo. C/C++ rules!!!";
                        print("<pre> " + "_".repeat(s.length + 2) + "\n< " + esc(s) + " >\n " + "-".repeat(s.length + 2) + "\n        \\   ^__^\n         \\  (oo)\\_______\n            (__)\\       )\\/\\\n                ||----w |\n                ||     ||</pre>");
                },
                ping: (a) =>
                {
                        const host = a[0] ?? "noxsoftware.pl";
                        let s = "PING " + esc(host) + " 56(84) bytes of data.\n";
                        for (let i = 1; i <= 4; i++)
                        {
                                s += "64 bytes from raspberrypi: icmp_seq=" + i + " ttl=64 time=" + (0.03 + Math.random() * 0.05).toFixed(3) + " ms\n";
                        }
                        print(s + "\n--- " + esc(host) + " ping statistics ---\n4 packets transmitted, 4 received, 0% packet loss");
                },
                pacman: (a) =>
                {
                        const op = a[0] ?? "";
                        if (op.startsWith("-S") && /windows/i.test(a.slice(1).join(" ")))
                        {
                                print("error: target not found: windows", "r");
                                return 1;
                        }
                        if (op.startsWith("-S"))
                        {
                                print("error: you cannot perform this operation unless you are root.", "r");
                                return 1;
                        }
                        if (op === "-Q")
                        {
                                print("base\nlinux\ndwm\nst\ndmenu\nzsh\nneovim\nfirefox\n<span class=\"f\"># btw</span>");
                                return 0;
                        }
                        print("error: no operation specified (use -h for help)", "r");
                        return 1;
                },
                yay: (a) =>
                {
                        if (/windows/i.test(a.join(" ")))
                        {
                                print(" -> No AUR package found for windows\n -> and nobody would maintain it anyway", "r");
                                return 1;
                        }
                        print(":: Searching AUR for updates...\n there is nothing to do");
                },
                startx: () =>
                {
                        print("startx: dwm is already running on :0", "y");
                        return 1;
                },
                Hyprland: () =>
                {
                        print("not in this house.", "y");
                        return 1;
                },
                windows: () =>
                {
                        bsod();
                        return 1;
                },
                winget: () => notArch("winget"),
                choco: () => notArch("choco"),
                scoop: () => notArch("scoop"),
                apt: () =>
                {
                        print("E: Could not open lock file - this is Arch, not Ubuntu.\n<span class=\"f\"># (the Raspberry Pi serving this page does run Ubuntu. we don't talk about that.)</span>", "r");
                        return 100;
                },
                edge: () =>
                {
                        print("zsh: command not found: edge\n<span class=\"f\"># firefox lives on tag www: </span>" + runBtn("firefox", "firefox"), "r");
                        return 127;
                },
                wsl: () => void print("you're already in real Linux."),
                reboot: () =>
                {
                        busy = true;
                        reboot(() =>
                        {
                                busy = false;
                                out.replaceChildren();
                                status = 0;
                                drawPrompt();
                                input.focus({ preventScroll: true });
                        });
                },
                emacs: () =>
                {
                        emacsTries++;
                        if (emacsTries === 1)
                        {
                                print("zsh: command not found: emacs. did you mean <span class=\"y\">nvim</span>?", "r");
                        }
                        else if (emacsTries === 2)
                        {
                                print("zsh: still not found. alias emacs='nvim' is in ~/.zshrc for a reason.", "r");
                        }
                        else
                        {
                                print("fine. " + runBtn("M-x butterfly", "M-x butterfly") + " and " + runBtn("M-x doctor", "M-x doctor") + " work. that's all the Emacs you get.", "y");
                        }
                        return 127;
                },
                code: () =>
                {
                        codeTries++;
                        const target = repoHere();
                        const toNvim = (msg: string): void =>
                        {
                                print(msg, "y");
                                setTimeout(() => openProject(target), 900);
                        };
                        if (codeTries > 1)
                        {
                                print("Installing extension 'vscodevim.vim'...");
                                toNvim("congratulations, you reinvented nvim. opening the real one.");
                                return 0;
                        }
                        ask(print("Do you trust the authors of the files in this folder? (y or n) "), "yn", (k) =>
                        {
                                if (k === "n")
                                {
                                        toNvim("Restricted Mode is intended for safe code browsing. nvim trusts you, opening that instead.");
                                        return;
                                }
                                print("<span class=\"f\">[main] starting Electron...\n[main] bundling a web browser to edit a text file...\n[main] RSS 1.2 GB and climbing</span>\n<span class=\"r\">[main] Extension host terminated unexpectedly.</span>");
                                toNvim("falling back to nvim. it started before you finished reading this.");
                        });
                        return 0;
                },
                "M-x": (a) =>
                {
                        const c = (a[0] ?? "").toLowerCase();
                        if (c === "butterfly")
                        {
                                return butterfly();
                        }
                        if (c === "doctor")
                        {
                                mode = "doctor";
                                print("I am the psychotherapist.  Please, describe your problems.  Type bye to leave.", "p");
                                return 0;
                        }
                        if (c === "tetris")
                        {
                                print("M-x tetris: this is a portfolio, not an operating system. (unlike Emacs)", "y");
                                return 1;
                        }
                        print("[No match]", "r");
                        return 1;
                }
        };
        CMDS.hyprland = CMDS.Hyprland!;
        CMDS.butterfly = () => butterfly();
        CMDS.doctor = () => CMDS["M-x"]!(["doctor"]);
        for (const k of ["win", "explorer.exe", "cmd.exe", "powershell", "regedit", "windows.exe"])
        {
                CMDS[k] = CMDS.windows!;
        }
        CMDS["apt-get"] = CMDS.apt!;
        CMDS.msedge = CMDS.edge!;
        CMDS.vscode = CMDS.code!;
        CMDS.codium = CMDS.code!;
        for (const k of ["shutdown", "poweroff", "systemctl"])
        {
                CMDS[k] = CMDS.reboot!;
        }

        function isCommand(word: string): boolean
        {
                return mode === "doctor" || Boolean(CMDS[word] || ALIASES[word] || word.startsWith("!") || dir(res(word)));
        }

        /* ----- line editor: syntax highlighting and autosuggestions ----- */
        function suggestion(): string
        {
                const v = input.value;
                if (!v || input.selectionStart !== v.length)
                {
                        return "";
                }
                for (let i = hist.length - 1; i >= 0; i--)
                {
                        const h = hist[i] ?? "";
                        if (h.startsWith(v) && h !== v)
                        {
                                return h.slice(v.length);
                        }
                }
                return "";
        }

        function paint(): void
        {
                let html = "";
                let first = true;
                for (const p of input.value.split(/(\s+)/))
                {
                        if (!p || /^\s+$/.test(p))
                        {
                                html += esc(p);
                                continue;
                        }
                        if (first)
                        {
                                first = false;
                                html += "<span class=\"" + (isCommand(p) ? "g" : "r") + "\">" + esc(p) + "</span>";
                                continue;
                        }
                        if (/^["']/.test(p))
                        {
                                html += "<span class=\"y\">" + esc(p) + "</span>";
                        }
                        else if (!p.startsWith("-") && (dir(res(p)) || isFile(res(p), REPOS)))
                        {
                                html += "<u>" + esc(p) + "</u>";
                        }
                        else
                        {
                                html += esc(p);
                        }
                }
                const sug = suggestion();
                if (sug)
                {
                        html += "<span class=\"ghost\">" + esc(sug) + "</span>";
                }
                hl.innerHTML = html;
                hl.scrollLeft = input.scrollLeft;
        }

        /* ----- completion (menu-select) ----- */
        function candidates(v: string): { head: string; word: string; base: string; items: [string, string][] }
        {
                const parts = v.split(" ");
                const word = parts[parts.length - 1] ?? "";
                const cmd = parts[0] ?? "";
                let head: string;
                let pool: [string, string][];
                if (parts.length === 1)
                {
                        head = "-- command --";
                        pool = Object.keys(CMDS).filter((k) => !HIDDEN.has(k)).map((k) => [k, DESCRIPTIONS[k] ? t(DESCRIPTIONS[k]!) : ""]);
                }
                else if (/^(open|nvim|vim|vi)$/.test(cmd))
                {
                        head = "-- project --";
                        pool = FEATURED.map((p) => [p.name.toLowerCase(), meta(p.repo).sub]);
                }
                else if (cmd === "man")
                {
                        head = "-- manual page --";
                        pool = [["nox", t("h.man")]];
                }
                else if (cmd === "setxkbmap")
                {
                        head = "-- layout --";
                        pool = [["us", "English"], ["pl", "Polski"]];
                }
                else if (cmd === "git")
                {
                        head = "-- git command --";
                        pool = [["log", "show commit logs"], ["status", "show the working tree status"]];
                }
                else if (cmd === "dwmc")
                {
                        head = "-- dwmc command --";
                        pool = [["view", ""], ["setlayout", ""], ["focusstack", ""], ["zoom", ""], ["killclient", ""]];
                }
                else
                {
                        head = "-- file --";
                        const slash = word.lastIndexOf("/");
                        const dirPart = slash === -1 ? "" : word.slice(0, slash + 1);
                        const d = dirPart ? res(dirPart) : cwd;
                        pool = listDir(d, REPOS).map((f) => [dirPart + f, ""]);
                }
                const base = parts.slice(0, -1).join(" ") + (parts.length > 1 ? " " : "");
                return { head, word, base, items: pool.filter(([p]) => p.toLowerCase().startsWith(word.toLowerCase())) };
        }

        function drawMenu(): void
        {
                if (!menu)
                {
                        return;
                }
                menuEl.replaceChildren(el("span", "hd", menu.head));
                menu.items.forEach(([name, desc], i) =>
                {
                        const s = el("span", i === menu!.idx ? "on" : "");
                        s.innerHTML = esc(name) + (desc ? "  <span class=\"f\">-- " + esc(desc) + "</span>" : "");
                        menuEl.append(s);
                });
                menuEl.hidden = false;
                scroll();
        }

        function closeMenu(): void
        {
                menu = null;
                menuEl.hidden = true;
        }

        function complete(back: boolean): void
        {
                if (menu)
                {
                        menu.idx = (menu.idx + (back ? -1 : 1) + menu.items.length) % menu.items.length;
                        input.value = menu.base + (menu.items[menu.idx]?.[0] ?? "");
                        drawMenu();
                        paint();
                        return;
                }
                const c = candidates(input.value);
                if (!c.items.length)
                {
                        return;
                }
                if (c.items.length === 1)
                {
                        const v = c.items[0]![0];
                        input.value = c.base + v + (v.endsWith("/") ? "" : " ");
                        paint();
                        return;
                }
                let prefix = c.items[0]![0];
                for (const [name] of c.items)
                {
                        while (!name.toLowerCase().startsWith(prefix.toLowerCase()))
                        {
                                prefix = prefix.slice(0, -1);
                        }
                }
                if (prefix.length > c.word.length)
                {
                        input.value = c.base + prefix;
                }
                menu = { head: c.head, items: c.items, idx: -1, base: c.base };
                drawMenu();
                paint();
        }

        /* ----- running ----- */
        function finish(code: number): void
        {
                status = code;
                if (!pending && !busy)
                {
                        drawPrompt();
                }
                else
                {
                        ps.innerHTML = "";
                }
                renderBar();
                scroll();
        }

        function run(lineText: string, nested = false): void
        {
                let raw = lineText.trim();
                if (!nested)
                {
                        print(prompt() + esc(lineText));
                }
                if (raw === "!!")
                {
                        raw = hist[hist.length - 1] ?? "";
                        print(esc(raw));
                }
                if (!nested && raw)
                {
                        if (hist[hist.length - 1] !== raw)
                        {
                                hist.push(raw);
                        }
                        hi = hist.length;
                }
                if (!raw)
                {
                        drawPrompt();
                        return;
                }
                if (mode === "doctor")
                {
                        doctorReply(raw);
                        finish(0);
                        return;
                }
                if (raw.replace(/\s/g, "").startsWith(":(){"))
                {
                        print("zsh: fork bomb defused. ulimit -u says no.", "r");
                        finish(1);
                        return;
                }
                if (/^(how (do i|to) )?(exit|quit|close) (n?vim|vi)\??$/i.test(raw))
                {
                        print(":q!  (you're welcome)", "y");
                        finish(0);
                        return;
                }
                let parts = raw.split(/\s+/);
                const alias = ALIASES[parts[0] ?? ""];
                if (alias)
                {
                        parts = [...alias.split(" "), ...parts.slice(1)];
                }
                const [cmd = "", ...args] = parts;
                let code = 0;
                if (cmd === "c" || cmd === "c++isthebest")
                {
                        print("<span class=\"y\">C</span> <span class=\"f\"># see </span>" + runBtn("noxsoftware.pl/" + cmd, "firefox noxsoftware.pl/" + cmd));
                }
                else if (CMDS[cmd])
                {
                        code = CMDS[cmd]!(args) || 0;
                }
                else if (!args.length && dir(res(cmd)))
                {
                        code = cd(cmd);
                }
                else
                {
                        const known = [...Object.keys(CMDS), ...Object.keys(ALIASES)].filter((k) => k.length > 1 && !k.startsWith(":"));
                        let best: string | null = null;
                        let bestDistance = 3;
                        for (const k of known)
                        {
                                const d = lev(cmd.toLowerCase(), k.toLowerCase());
                                if (d < bestDistance && d <= (cmd.length > 4 ? 2 : 1))
                                {
                                        bestDistance = d;
                                        best = k;
                                }
                        }
                        if (best)
                        {
                                const fixed = [best, ...args].join(" ");
                                ask(print("zsh: correct '<span class=\"r\">" + esc(cmd) + "</span>' to '<span class=\"g\">" + esc(best) + "</span>' [nyae]? "), "nyae", (k) =>
                                {
                                        if (k === "y")
                                        {
                                                run(fixed, true);
                                        }
                                        else if (k === "e")
                                        {
                                                input.value = fixed;
                                                paint();
                                        }
                                        else if (k === "n")
                                        {
                                                print("zsh: command not found: " + esc(cmd), "r");
                                                status = 127;
                                        }
                                });
                                return;
                        }
                        print("zsh: command not found: " + esc(cmd), "r");
                        code = 127;
                }
                finish(code);
        }
        w.run = run;

        out.addEventListener("click", (e) =>
        {
                const b = (e.target as HTMLElement).closest<HTMLButtonElement>(".run");
                if (!b || busy || pending)
                {
                        return;
                }
                run(b.dataset.cmd ?? "");
                input.focus({ preventScroll: true });
        });

        input.addEventListener("input", () =>
        {
                navPrefix = null;
                if (menu)
                {
                        closeMenu();
                }
                paint();
        });
        input.addEventListener("keydown", (e) =>
        {
                if (busy)
                {
                        e.preventDefault();
                        return;
                }
                if (pending)
                {
                        const k = e.key.toLowerCase();
                        if (k.length === 1 && pending.keys.includes(k))
                        {
                                answer(k);
                        }
                        else if (e.key === "Enter")
                        {
                                answer("n");
                        }
                        e.preventDefault();
                        return;
                }
                if (e.key === "Tab")
                {
                        complete(e.shiftKey);
                        e.preventDefault();
                        return;
                }
                if (menu && e.key === "Enter")
                {
                        closeMenu();
                        paint();
                        e.preventDefault();
                        return;
                }
                if (menu && e.key !== "Shift")
                {
                        closeMenu();
                }
                if (e.key === "Enter")
                {
                        const v = input.value;
                        input.value = "";
                        navPrefix = null;
                        paint();
                        run(v);
                        e.preventDefault();
                }
                else if ((e.key === "ArrowRight" || e.key === "End") && input.selectionStart === input.value.length && suggestion())
                {
                        input.value += suggestion();
                        paint();
                        e.preventDefault();
                }
                else if (e.key === "ArrowUp" || e.key === "ArrowDown")
                {
                        // history-substring-search
                        if (navPrefix === null)
                        {
                                navPrefix = input.value;
                                hi = hist.length;
                        }
                        const d = e.key === "ArrowUp" ? -1 : 1;
                        let i = hi + d;
                        while (i >= 0 && i < hist.length && !(hist[i] ?? "").includes(navPrefix))
                        {
                                i += d;
                        }
                        if (i < 0)
                        {
                                i = hi;
                        }
                        hi = Math.min(i, hist.length);
                        input.value = hi >= hist.length ? navPrefix : hist[hi] ?? "";
                        paint();
                        e.preventDefault();
                }
                else if (e.key === "l" && e.ctrlKey)
                {
                        out.replaceChildren();
                        e.preventDefault();
                }
                else if (e.key === "u" && e.ctrlKey)
                {
                        input.value = "";
                        paint();
                        e.preventDefault();
                }
                else if (e.key === "c" && e.ctrlKey && !window.getSelection()?.toString())
                {
                        print(prompt() + esc(input.value) + "^C");
                        input.value = "";
                        status = 130;
                        drawPrompt();
                        e.preventDefault();
                }
        });
        input.addEventListener("keyup", paint);
        input.addEventListener("scroll", () =>
        {
                hl.scrollLeft = input.scrollLeft;
        });
        body.addEventListener("mouseup", () =>
        {
                if (!window.getSelection()?.toString())
                {
                        input.focus({ preventScroll: true });
                }
        });
        w.onFocus = () =>
        {
                if (!launcherOpen())
                {
                        input.focus({ preventScroll: true });
                }
        };

        drawPrompt();
        if (!S.booted)
        {
                S.booted = true;
                print(prompt() + "neofetch");
                neofetch();
                if (data.notFound)
                {
                        print(prompt() + "cd " + esc(location.pathname));
                        print("cd: no such file or directory: " + esc(location.pathname), "r");
                        print("404. " + runBtn("ls ~/projects", "ls ~/projects") + " " + runBtn("help", "help"), "d");
                        status = 1;
                        drawPrompt();
                }
                const welcome = print(t("welcome"), "d");
                w.onLang = () =>
                {
                        if (welcome.isConnected)
                        {
                                welcome.innerHTML = t("welcome");
                        }
                };
        }
}

register("zsh", render);
