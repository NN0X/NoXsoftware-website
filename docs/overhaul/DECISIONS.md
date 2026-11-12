# NoXsoftware.pl overhaul: decisions

Working record of what was agreed for the v2 site. `mockup.html` is the clickable prototype the
real site was built from; `gen_repo_data.py` is the throwaway script that fed it (superseded by
`scripts/fetch-repos.mjs`).

## Phases

1. Astro site, build-time repo data, plain pages in EN/PL, the dwm desktop (zsh, htop, nvim, Firefox), CI
2. WebAssembly builds of Brutus and Cicero replacing the demo mocks
3. F1Ratings tables: the Pi re-runs F1Ratings on a timer and publishes `/data/f1.json`; the site reads it at runtime
4. Easter-egg pages with re-encoded media, deploy workflow and the Pi pull script

## Stack and hosting

| Area | Decision |
|---|---|
| Framework | Astro + TypeScript, static output served by Apache on the Raspberry Pi |
| Demos | Brutus and Cicero compiled to WebAssembly (Emscripten) and run in the browser; PHP `shell_exec` endpoints removed |
| F1 ratings | A systemd timer on the Pi (Mon + Thu) clones or pulls F1Ratings, runs it unmodified on the public Kaggle dataset and atomically replaces `/data/f1.json`, which lives outside the deployed site. Ratings stay current without a rebuild; a failed run keeps the last good file |
| Deploy | Every push to `master` is built by GitHub Actions and published as the assets of one rolling `site` release (public downloads, so the Pi holds no token; a workflow artifact would have needed one). A systemd timer on the Pi polls it every 5 minutes, verifies the archive and swaps a `current` symlink atomically; the last three builds stay for `--rollback`. No inbound access to the home network |
| Media | Easter eggs kept; videos re-encoded to 720p H.264 MP4 (73 → 18 MB, plays everywhere), GIFs to animated WebP with transparency (4.4 → 0.7 MB) by `scripts/encode-media.sh`; originals stay on the `legacy` branch |
| Languages | English and Polish, `/pl/…` URLs for the static pages, auto-detected from the browser and remembered |
| Static pages | Every project also exists as a plain HTML page (`/projects/<slug>`) for search engines, link sharing and no-JS visitors; the desktop loads on top |
| Process | Phased PRs from the session branch into `dev`; `dev` → `master` by the owner |
| Code style | Allman braces, 8-space indent, camelCase functions and variables, PascalCase types, UPPER_CASE constants (as in TDC2's `.clang-format` / `.clang-tidy`); enforced with ESLint stylistic rules since Prettier cannot do Allman |

## Design: a dwm desktop

- dwm only (Hyprland mode was tried and dropped). Tags: `~` (zsh + htop), `dev` (nvim), `f1`, `www` (Firefox).
- Per-tag layouts (pertag patch), hide-vacant-tags on narrow screens, monocle on phones.
- Bar: logo opens dmenu, tags, layout symbol, window title with close button, `[us]`/`[pl]` keyboard-layout
  indicator that switches the site language, Kraków weather and Kraków date/time.
- Weather location is fixed to Kraków; temperature from Open-Meteo, cached 10 minutes like `get_weather.sh`.
- zsh with oh-my-zsh (robbyrussell prompt, git plugin), zsh-syntax-highlighting, zsh-autosuggestions,
  menu completion, history substring search, `setopt autocd correct`.
- nvim dashboard lists the featured projects; project pages use a render-markdown look with
  README / code excerpt / git log / demo tabs. Write-ups are Markdown per language; everything else
  (file tree, excerpt, commits, activity chart) is generated from git at build time.
- htop lists every repo as a process.
- Firefox is partly usable: tabs, history, address bar, bookmarks, about: pages, the site's own plain
  pages and egg pages; other sites show Firefox's frame-refusal page with an "open in new window" link.
- No CV page. Contact lives in `man nox`, `cat contact.txt`, `mail` and the Firefox new tab.

### Rule: everything is reachable by clicking and by commands

| Thing | Click | Command |
|---|---|---|
| Projects | htop row, nvim dashboard, dmenu, `ls` output | `open <project> [readme\|code\|log\|demo]`, `nvim`, `cat README.md` |
| Demos | demo tab | `cicero <text>`, `brutus <key> <text>` |
| F1 ratings | tag `f1`, headers sort, rows plot, nvim `ratings` tab, `/projects/f1ratings/` | `f1ratings [--teams] [--all-time] [--sort name\|peak\|now\|delta] [plot <name>]`, `f1ratings print\|change <name>` (or `python main.py …` in `~/projects/F1Ratings`) |
| Browser | tag `www`, bookmarks, links | `firefox [url]` |
| Contact | Firefox new tab | `man nox`, `cat contact.txt`, `mail` |
| Language | `[us]`/`[pl]` in the bar | `setxkbmap pl`, `export LANG=pl_PL.UTF-8`, `:lang pl` |
| Tags, layouts, focus, close | bar, help-line chips, title `×` | `dwmc view N`, `dwmc setlayout …`, `dwmc focusstack`, `dwmc killclient` |
| Any listed command | click it in `help` output | type it |
