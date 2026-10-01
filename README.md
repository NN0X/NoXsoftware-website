# NoXsoftware.pl

My personal self-hosted website: a dwm desktop in the browser, with zsh, htop, nvim and a (partly)
working Firefox, showing my projects. Every page also exists as plain HTML for search engines,
visitors without JavaScript and anyone who prefers a normal website.

C/C++ still rules. The website is TypeScript because browsers insist.

## Stack

- [Astro](https://astro.build) 7, TypeScript, static output only
- Served by Apache2 on a Raspberry Pi (Ubuntu Server) behind Cloudflare
- No runtime dependencies besides the self-hosted Ubuntu Mono font

## Working on it

```sh
npm ci
npm run dev       # local dev server
npm run verify    # lint, type check, tests, build (what CI runs)
npm run data      # refresh src/data/repos.json from GitHub
npm run wasm      # rebuild the Brutus and Cicero demos (needs Emscripten on PATH)
```

The in-browser demos are the real C++ from Brutus-Encryption and CiceroTokenizer, compiled with
Emscripten at the commits pinned in `scripts/build-wasm.sh`. The output in `public/wasm/` is
committed, so the site builds without Emscripten; `tests/wasm.test.ts` checks it against the
native CLIs.

`npm run data` lists public repos through the GitHub API (set `GITHUB_TOKEN` to avoid rate limits),
then reads each one with a history-only `git clone --filter=blob:none`. Where the API is not
reachable it reuses the previous list, or takes one explicitly: `npm run data -- --repos A,B,C`.

## Where things live

| Path | What |
|---|---|
| `src/content/projects/{en,pl}/*.md` | Hand-written project write-ups, one per language |
| `src/data/projects.json` | Featured projects: order, dashboard key, licence, code excerpt location |
| `src/data/repos.json` | Generated: activity, commits, file trees and excerpts for every public repo |
| `src/pages/` | Routes; `/pl/…` mirrors `/…` |
| `src/components/` | The plain pages |
| `src/scripts/desktop/` | The desktop: window manager, bar, dmenu and the zsh, htop, nvim and Firefox windows |
| `src/lib/` | Code shared by both: highlighting, the activity chart, strings in both languages |
| `wasm/` | Bindings that expose Brutus and Cicero to JavaScript |
| `public/wasm/` | Generated: the compiled demos and Cicero's 2^16 dictionary |
| `public/.htaccess` | Apache config: redirects from the old URLs, error page, cache headers |
| `docs/overhaul/` | Design decisions and the original clickable mockup |

## Code style

Same as my C/C++ repos: Allman braces, 8-space indents, camelCase functions and variables,
PascalCase types, UPPER_CASE constants. ESLint enforces it (`npm run lint`).

## License

NoXsoftware.pl is under [Apache 2.0](LICENSE.md) license and [Common Clause](NOTICE.md).

### Commercial use

No idea why somebody would use website specifically created by me for me. Still feel free to copy, but remember that Common Clause applies.
