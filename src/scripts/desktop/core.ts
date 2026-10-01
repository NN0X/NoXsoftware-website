// Shared state of the desktop: the embedded data, the window list and small helpers every module uses.
import type { DesktopData, Lang, ProjectConfig, ProjectText, Repo } from "../../data/types";
import { translate, type StringKey } from "../../lib/i18n";
import { monthRange } from "../../lib/activity";

export type Layout = "tile" | "mono" | "float";

export interface Win
{
        id: number;
        kind: string;
        tag: number;
        node: HTMLDivElement;
        body: HTMLDivElement;
        data: string | null;
        fx: number;
        fy: number;
        fw: number;
        fh: number;
        title: () => string;
        onFocus?: () => void;
        onClose?: () => void;
        onLang?: () => void;
        run?: (line: string) => void;
        open?: (repo: string, section?: string) => void;
        home?: () => void;
        go?: (url: string) => void;
}

export interface ProjectMeta
{
        repo: string;
        name: string;
        slug: string;
        sub: string;
        html: string;
        license?: string;
        authors?: string;
        demo?: string;
        key?: string;
        featured: boolean;
}

export let data: DesktopData;
export let REPOS: Record<string, Repo> = {};
export let FEATURED: (ProjectConfig & { text: Record<Lang, ProjectText> })[] = [];
export let MONTHS: string[] = [];

export const TAGS = ["~", "dev", "f1", "4", "5", "6", "7", "8", "www"];

export const S = {
        lang: "en" as Lang,
        tag: 1,
        // pertag patch: every tag keeps its own layout
        layouts: { 1: "tile", 2: "mono", 3: "mono", 9: "mono" } as Record<number, Layout>,
        wins: [] as Win[],
        focused: {} as Record<number, Win | undefined>,
        seq: 0,
        booted: false
};

export function loadData(raw: DesktopData): void
{
        data = raw;
        REPOS = raw.repos;
        FEATURED = raw.projects;
        MONTHS = monthRange(raw.generated);
}

export function t(key: StringKey, vars?: Record<string, string | number>): string
{
        return translate(S.lang, key, vars);
}

export function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K]
{
        const e = document.createElement(tag);
        if (cls)
        {
                e.className = cls;
        }
        if (text !== undefined)
        {
                e.textContent = text;
        }
        return e;
}

export function store(key: string, value?: string): string | null
{
        try
        {
                if (value === undefined)
                {
                        return localStorage.getItem(key);
                }
                localStorage.setItem(key, value);
        }
        catch
        {
                // private mode or blocked storage: the desktop simply forgets
        }
        return null;
}

export function meta(repo: string): ProjectMeta
{
        const p = FEATURED.find((x) => x.repo === repo);
        if (!p)
        {
                return { repo, name: repo, slug: repo.toLowerCase(), sub: REPOS[repo]?.description ?? "", html: "", featured: false };
        }
        const text = p.text[S.lang] ?? p.text.en;
        return { repo, name: p.name, slug: p.slug, sub: text.sub, html: text.html, license: p.license, authors: p.authors, demo: p.demo, key: p.key, featured: true };
}

export function nameOf(repo: string): string
{
        return meta(repo).name;
}

export function total(repo: string): number
{
        return Object.values(REPOS[repo]?.activity ?? {}).reduce((a, b) => a + b, 0);
}

export function findRepo(query: string | undefined): string | undefined
{
        if (!query)
        {
                return undefined;
        }
        const q = query.toLowerCase().replace(/\/$/, "").replace(/^.*\//, "");
        const names = Object.keys(REPOS);
        return names.find((r) => r.toLowerCase() === q || nameOf(r).toLowerCase() === q)
                ?? names.find((r) => r.toLowerCase().startsWith(q) || nameOf(r).toLowerCase().startsWith(q));
}

export function pathFor(lang: Lang, path: string): string
{
        return (lang === "pl" ? "/pl" : "") + path;
}

export function reducedMotion(): boolean
{
        return matchMedia("(prefers-reduced-motion: reduce)").matches;
}
