// Shapes of the generated data (src/data/repos.json) and the project config (src/data/projects.json).

export type Lang = "en" | "pl";

export interface Excerpt
{
        path: string;
        from: number;
        lang: string;
        code: string;
}

export interface Repo
{
        description: string;
        lang: string;
        archived: boolean;
        branch: string;
        last: string;
        activity: Record<string, number>;
        log: [string, string, string][];
        tree: [string, boolean][];
        excerpt?: Excerpt;
}

export interface RepoSnapshot
{
        generated: string;
        user: string;
        repos: Record<string, Repo>;
}

export interface ProjectConfig
{
        slug: string;
        repo: string;
        name: string;
        key: string;
        license?: string;
        authors?: string;
        demo?: string;
        excerpt?: { path: string; from: number; to: number; lang: string };
}

export interface ProjectText
{
        sub: string;
        html: string;
}

// Everything the desktop needs, embedded once per page as JSON.
export interface DesktopData
{
        lang: Lang;
        generated: string;
        user: string;
        repos: Record<string, Repo>;
        projects: (ProjectConfig & { text: Record<Lang, ProjectText> })[];
        open?: string;
        focus?: string;
        notFound?: boolean;
}
