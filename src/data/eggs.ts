// Easter eggs kept from the old site: a meme video each, reachable at the old secret URLs.
export interface Egg
{
        // /eggs/<slug>/
        slug: string;
        // the old secret path, still redirected by public/.htaccess and listed in ~/.eggs
        path: string;
        title: string;
        video: string;
        poster: string;
}

export const EGGS: Egg[] = [
        { slug: "c", path: "c", title: "C", video: "/media/eggs/c.mp4", poster: "/media/eggs/c.webp" },
        { slug: "cpp", path: "c++isthebest", title: "C++ is the best", video: "/media/eggs/cpp.mp4", poster: "/media/eggs/cpp.webp" },
        { slug: "linux", path: "linux>windowsallday", title: "Linux > Windows, all day", video: "/media/eggs/linux.mp4", poster: "/media/eggs/linux.webp" },
        { slug: "python", path: "pythonistoobadforbeingthisuseful", title: "Python is too bad for being this useful", video: "/media/eggs/python.mp4", poster: "/media/eggs/python.webp" }
];

// Accepts the old path, the slug, or "eggs/<slug>", with or without slashes.
export function findEgg(path: string): Egg | undefined
{
        const p = path.replace(/^\/+|\/+$/g, "").replace(/^eggs\//, "");
        return EGGS.find((e) => e.path === p || e.slug === p);
}
