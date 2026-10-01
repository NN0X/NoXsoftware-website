import type { Lang } from "../data/types";

// Every user-facing string, in both languages. Shell messages stay English on purpose: zsh is not localised.
const STRINGS = {
        en:
        {
                "site.tagline": "Systems programmer. Compilers, simulators and protocols, mostly in C and C++.",
                "site.description": "NoX's projects: compilers, simulators, post-quantum protocols and more, mostly in C and C++.",
                "site.projects": "Projects",
                "site.allRepos": "All repositories",
                "site.contact": "Contact",
                "site.contactNote": "E-mails and messages containing links are discarded.",
                "site.plainNote": "This is the plain version of the site.",
                "site.openDesktop": "Open the desktop",
                "site.otherLang": "Polski",
                "site.back": "← all projects",
                "site.repo": "Repository",
                "site.recent": "Recent commits",
                "site.notFound": "Page not found!",
                "site.notFoundSub": "Nothing lives at this address. The projects are this way:",
                "site.noWriteup": "No write-up yet; this page shows what GitHub knows about the repository.",
                "site.generated": "Repository data generated {d}.",
                "site.code": "Code excerpt",
                "site.hosted": "Apache 2.0 + Commons Clause · hosted on a Raspberry Pi in Kraków",
                "hint.helpPre": "New here? Type ",
                "hint.helpPost": " in the terminal.",
                "hint.new": "Projects live on tag dev, links and e-mail on tag www. Language: click [us] in the bar.",
                "hint.plain": "plain version",
                "k.dmenu": "dmenu", "k.tags": "tags", "k.term": "terminal", "k.focus": "focus", "k.layout": "layouts", "k.close": "close",
                "welcome": "Welcome. Type <b class=\"y\">help</b>, or start typing and press <b class=\"y\">→</b> to accept a suggestion.",
                "help.title": "Things to try (Tab completes, ↑ searches history, → accepts a suggestion)",
                "h.ls": "look around ~", "h.cd": "or just type a directory name (autocd)", "h.open": "open a project",
                "h.sec": "jump to a tab: readme, code, log, demo", "h.demo": "run a demo right here", "h.htop": "every repo as a process",
                "h.ff": "a (partly) working browser", "h.man": "who is this", "h.contact": "how to reach me", "h.git": "latest commits everywhere",
                "h.lang": "switch language (or click us/pl in the bar)", "h.dwmc": "drive dwm from the shell", "h.fun": "important tools",
                "h.classic": "classics", "h.f1": "XRating", "h.secret": "…and a few more you'll have to find yourself. Click any yellow command to run it.",
                "dash.all": "every repo, sorted by commits, in htop", "dash.loaded": "nvim loaded {n} projects in {ms} ms",
                "md.glance": "At a glance", "md.links": "Links", "md.latest": "latest commit", "md.try": "→ try the demo tab above",
                "md.nowrite": "No write-up yet. This shows what GitHub knows about the repository.",
                "f.lang": "language", "f.lic": "licence", "f.commits": "commits", "f.last": "last push", "f.peak": "peak month", "f.authors": "authors",
                "chart": "commits per month",
                "code.note": "excerpt: lines {a}–{b} of {p}, pulled from the repo at build time",
                "log.full": "full history on GitHub ↗",
                "demo.cicero": "cicero -i <text> --dict 2^16.tok (mock tokenizer until the WebAssembly build lands)",
                "demo.brutus": "brutus <key> <text> (mock cipher until the WebAssembly build lands)",
                "demo.text": "text", "demo.key": "key", "demo.tokens": "{n} tokens · {c} chars", "demo.ratio": "{a} → {b} chars (1:1, as promised)",
                "nv.ph": ":q back · :e log · :lang pl · :help", "nv.phDash": ":q quit · :e <project> · :lang pl · :help",
                "htop.sum": "Tasks: <b>{t}</b>, <b class=\"g\">{r}</b> running · Commits: <b>{c}</b> · meters = share of commits by language",
                "htop.open": "open", "htop.sort": "sort", "htop.r": "R = pushed in the last 30 days", "htop.close": "close",
                "ff.tab": "New Tab", "ff.url": "Search or enter address", "ff.top": "Shortcuts", "ff.mail": "E-mail",
                "ff.note": "dwm rule: { \"Firefox\", NULL, NULL, 1 << 8, 0, -1 } → always on tag 9",
                "ff.plain": "This is the plain HTML version of the site: what search engines and visitors without JavaScript get.",
                "ff.openNvim": "Open in nvim",
                "wx": "Kraków. Temperature from Open-Meteo, cached for 10 minutes like get_weather.sh.",
                "kbd": "Keyboard layout = site language. Click to switch.",
                "lang.switched": "Language: English",
                "f1.soon": "The XRating tables arrive with the F1Ratings page (phase 3). Until then, here is the write-up."
        },
        pl:
        {
                "site.tagline": "Programista systemowy. Kompilatory, symulatory i protokoły, głównie w C i C++.",
                "site.description": "Projekty NoX-a: kompilatory, symulatory, protokoły postkwantowe i nie tylko, głównie w C i C++.",
                "site.projects": "Projekty",
                "site.allRepos": "Wszystkie repozytoria",
                "site.contact": "Kontakt",
                "site.contactNote": "E-maile i wiadomości zawierające linki są odrzucane.",
                "site.plainNote": "To zwykła wersja strony.",
                "site.openDesktop": "Otwórz pulpit",
                "site.otherLang": "English",
                "site.back": "← wszystkie projekty",
                "site.repo": "Repozytorium",
                "site.recent": "Ostatnie commity",
                "site.notFound": "Nie znaleziono strony!",
                "site.notFoundSub": "Pod tym adresem nic nie ma. Projekty są tutaj:",
                "site.noWriteup": "Brak opisu; ta strona pokazuje, co GitHub wie o repozytorium.",
                "site.generated": "Dane repozytoriów wygenerowano {d}.",
                "site.code": "Fragment kodu",
                "site.hosted": "Apache 2.0 + Commons Clause · hostowane na Raspberry Pi w Krakowie",
                "hint.helpPre": "Pierwszy raz? Wpisz ",
                "hint.helpPost": " w terminalu.",
                "hint.new": "Projekty są na tagu dev, linki i e-mail na tagu www. Język: kliknij [pl] na pasku.",
                "hint.plain": "zwykła wersja",
                "k.dmenu": "dmenu", "k.tags": "tagi", "k.term": "terminal", "k.focus": "fokus", "k.layout": "układy", "k.close": "zamknij",
                "welcome": "Witaj. Wpisz <b class=\"y\">help</b> albo zacznij pisać i naciśnij <b class=\"y\">→</b>, żeby przyjąć podpowiedź.",
                "help.title": "Co można zrobić (Tab uzupełnia, ↑ przeszukuje historię, → przyjmuje podpowiedź)",
                "h.ls": "rozejrzyj się po ~", "h.cd": "albo po prostu wpisz nazwę katalogu (autocd)", "h.open": "otwórz projekt",
                "h.sec": "skok do zakładki: readme, code, log, demo", "h.demo": "uruchom demo tutaj", "h.htop": "każde repo jako proces",
                "h.ff": "(częściowo) działająca przeglądarka", "h.man": "kto to jest", "h.contact": "jak się ze mną skontaktować", "h.git": "najnowsze commity",
                "h.lang": "zmień język (albo kliknij us/pl na pasku)", "h.dwmc": "steruj dwm z powłoki", "h.fun": "ważne narzędzia",
                "h.classic": "klasyka", "h.f1": "XRating", "h.secret": "…i jeszcze kilka do samodzielnego odkrycia. Kliknij żółte polecenie, aby je uruchomić.",
                "dash.all": "każde repo, posortowane po commitach, w htop", "dash.loaded": "nvim wczytał {n} projektów w {ms} ms",
                "md.glance": "W skrócie", "md.links": "Linki", "md.latest": "ostatni commit", "md.try": "→ wypróbuj zakładkę demo powyżej",
                "md.nowrite": "Brak opisu. Tu widać, co GitHub wie o repozytorium.",
                "f.lang": "język", "f.lic": "licencja", "f.commits": "commity", "f.last": "ostatni push", "f.peak": "szczyt", "f.authors": "autorzy",
                "chart": "commity miesięcznie",
                "code.note": "fragment: linie {a}–{b} pliku {p}, pobrany z repozytorium przy budowaniu",
                "log.full": "pełna historia na GitHubie ↗",
                "demo.cicero": "cicero -i <tekst> --dict 2^16.tok (atrapa tokenizera do czasu wersji WebAssembly)",
                "demo.brutus": "brutus <klucz> <tekst> (atrapa szyfru do czasu wersji WebAssembly)",
                "demo.text": "tekst", "demo.key": "klucz", "demo.tokens": "{n} tokenów · {c} znaków", "demo.ratio": "{a} → {b} znaków (1:1, jak obiecano)",
                "nv.ph": ":q wstecz · :e log · :lang en · :help", "nv.phDash": ":q wyjdź · :e <projekt> · :lang en · :help",
                "htop.sum": "Zadania: <b>{t}</b>, <b class=\"g\">{r}</b> działa · Commity: <b>{c}</b> · wskaźniki = udział commitów wg języka",
                "htop.open": "otwórz", "htop.sort": "sortuj", "htop.r": "R = push w ostatnich 30 dniach", "htop.close": "zamknij",
                "ff.tab": "Nowa karta", "ff.url": "Wyszukaj lub wpisz adres", "ff.top": "Skróty", "ff.mail": "E-mail",
                "ff.note": "reguła dwm: { \"Firefox\", NULL, NULL, 1 << 8, 0, -1 } → zawsze na tagu 9",
                "ff.plain": "To zwykła wersja HTML tej strony: widzą ją wyszukiwarki i osoby bez JavaScriptu.",
                "ff.openNvim": "Otwórz w nvim",
                "wx": "Kraków. Temperatura z Open-Meteo, z pamięcią podręczną 10 minut jak w get_weather.sh.",
                "kbd": "Układ klawiatury = język strony. Kliknij, aby zmienić.",
                "lang.switched": "Język: polski",
                "f1.soon": "Tabele XRating pojawią się razem ze stroną F1Ratings (etap 3). Do tego czasu jest opis."
        }
} as const;

export type StringKey = keyof typeof STRINGS.en;

export function translate(lang: Lang, key: StringKey, vars?: Record<string, string | number>): string
{
        let s: string = STRINGS[lang][key] ?? STRINGS.en[key];
        if (vars)
        {
                for (const [k, v] of Object.entries(vars))
                {
                        s = s.split("{" + k + "}").join(String(v));
                }
        }
        return s;
}

export const MAN_PAGE: Record<Lang, string> = {
        en: "<span class=\"b\">NOX(1)                     User Commands                     NOX(1)</span>\n\n<span class=\"b\">NAME</span>\n       nox - systems programmer\n\n<span class=\"b\">SYNOPSIS</span>\n       <span class=\"b\">nox</span> [<span class=\"y\">--c</span>] [<span class=\"y\">--c++</span>] [<span class=\"y\">--allman</span>] [<span class=\"y\">--indent</span>=8]\n\n<span class=\"b\">DESCRIPTION</span>\n       Computer Science student at Cracow University of Technology and\n       Associate Software Engineer at IBM. Writes compilers, simulators,\n       tokenizers and post-quantum protocols, mostly in C and C++.\n\n<span class=\"b\">CONTACT</span>\n       nox@noxsoftware.pl · <a href=\"https://github.com/NN0X\">github.com/NN0X</a> · <a href=\"https://linkedin.com/in/tomasz-sarkowicz\">linkedin</a>\n\n<span class=\"b\">BUGS</span>\n       E-mails and messages containing links are discarded.",
        pl: "<span class=\"b\">NOX(1)                 Polecenia użytkownika                 NOX(1)</span>\n\n<span class=\"b\">NAZWA</span>\n       nox - programista systemowy\n\n<span class=\"b\">SKŁADNIA</span>\n       <span class=\"b\">nox</span> [<span class=\"y\">--c</span>] [<span class=\"y\">--c++</span>] [<span class=\"y\">--allman</span>] [<span class=\"y\">--indent</span>=8]\n\n<span class=\"b\">OPIS</span>\n       Student informatyki na Politechnice Krakowskiej i Associate\n       Software Engineer w IBM. Pisze kompilatory, symulatory,\n       tokenizery i protokoły postkwantowe, głównie w C i C++.\n\n<span class=\"b\">KONTAKT</span>\n       nox@noxsoftware.pl · <a href=\"https://github.com/NN0X\">github.com/NN0X</a> · <a href=\"https://linkedin.com/in/tomasz-sarkowicz\">linkedin</a>\n\n<span class=\"b\">BŁĘDY</span>\n       E-maile i wiadomości zawierające linki są odrzucane."
};
