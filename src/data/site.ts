import type { DesktopData, Lang, ProjectConfig, ProjectText, RepoSnapshot } from "./types";
import config from "./projects.json";
import snapshot from "./repos.json";
import { getCollection } from "astro:content";

// JSON imports widen tuples to arrays; the generator guarantees the real shape.
export const SNAPSHOT = snapshot as unknown as RepoSnapshot;
export const SITE_REPOS = SNAPSHOT.repos;
export const PROJECTS = config.projects as ProjectConfig[];
export const LANGS: Lang[] = ["en", "pl"];

export function pathFor(lang: Lang, path: string): string
{
        return (lang === "pl" ? "/pl" : "") + path;
}

export async function projectTexts(): Promise<Record<string, Record<Lang, ProjectText>>>
{
        const entries = await getCollection("projects");
        const out: Record<string, Record<Lang, ProjectText>> = {};
        for (const entry of entries)
        {
                const [lang, slug] = entry.id.split("/") as [Lang, string];
                out[slug] ??= {} as Record<Lang, ProjectText>;
                out[slug][lang] = { sub: entry.data.sub, html: entry.rendered?.html ?? "" };
        }
        for (const p of PROJECTS)
        {
                for (const lang of LANGS)
                {
                        if (!out[p.slug]?.[lang])
                        {
                                throw new Error("Missing write-up: src/content/projects/" + lang + "/" + p.slug + ".md");
                        }
                }
        }
        return out;
}

export function totalCommits(repo: string): number
{
        return Object.values(SITE_REPOS[repo]?.activity ?? {}).reduce((a, b) => a + b, 0);
}

export function slugOf(repo: string): string
{
        return PROJECTS.find((p) => p.repo === repo)?.slug ?? repo.toLowerCase();
}

export function repoOfSlug(slug: string): string | undefined
{
        return PROJECTS.find((p) => p.slug === slug)?.repo ?? Object.keys(SITE_REPOS).find((r) => r.toLowerCase() === slug);
}

export async function desktopData(lang: Lang, open?: string): Promise<DesktopData>
{
        const texts = await projectTexts();
        return {
                lang,
                generated: SNAPSHOT.generated,
                user: SNAPSHOT.user,
                repos: SITE_REPOS,
                projects: PROJECTS.map((p) => ({ ...p, text: texts[p.slug] as Record<Lang, ProjectText> })),
                ...(open ? { open } : {})
        };
}
