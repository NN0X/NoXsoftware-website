// The tiny filesystem the shell walks around in. Pure functions, so they can be unit-tested.
import type { Repo } from "../../data/types";

export const EGGS = ["c", "c++isthebest", "linux>windowsallday", "pythonistoobadforbeingthisuseful"];

const FILES: Record<string, string[]> = {
        "~": ["projects/", "contact.txt", "README.md", ".zshrc", ".eggs/"],
        "~/.eggs": EGGS
};

export function resolve(cwd: string, prev: string, repos: Record<string, Repo>, path?: string): string
{
        if (!path || path === "~")
        {
                return "~";
        }
        if (path === "-")
        {
                return prev;
        }
        const parts = path.startsWith("~") ? path.replace(/^~\/?/, "").split("/") : [...(cwd === "~" ? [] : cwd.slice(2).split("/")), ...path.split("/")];
        const stack: string[] = [];
        for (const x of parts)
        {
                if (!x || x === ".")
                {
                        continue;
                }
                if (x === "..")
                {
                        stack.pop();
                }
                else if (x === "...")
                {
                        stack.pop();
                        stack.pop();
                }
                else
                {
                        stack.push(x);
                }
        }
        if (stack[0] === "projects" && stack[1])
        {
                const name = stack[1].toLowerCase();
                const repo = Object.keys(repos).find((r) => r.toLowerCase() === name);
                if (repo)
                {
                        stack[1] = repo;
                }
        }
        return stack.length ? "~/" + stack.join("/") : "~";
}

export function repoOfDir(dir: string, repos: Record<string, Repo>): string | null
{
        const m = dir.match(/^~\/projects\/([^/]+)/);
        return m && m[1] && repos[m[1]] ? m[1] : null;
}

export function isDir(dir: string, repos: Record<string, Repo>): boolean
{
        if (dir === "~" || dir === "~/projects" || dir === "~/.eggs")
        {
                return true;
        }
        const m = dir.match(/^~\/projects\/([^/]+)$/);
        return Boolean(m && m[1] && repos[m[1]]);
}

export function listDir(dir: string, repos: Record<string, Repo>): string[]
{
        if (dir === "~/projects")
        {
                return Object.keys(repos).map((r) => r + "/");
        }
        const m = dir.match(/^~\/projects\/([^/]+)$/);
        if (m && m[1] && repos[m[1]])
        {
                return repos[m[1]]!.tree.map(([name, isTree]) => name + (isTree ? "/" : ""));
        }
        return FILES[dir] ?? [];
}

export function isFile(full: string, repos: Record<string, Repo>): boolean
{
        const slash = full.lastIndexOf("/");
        const dir = slash === -1 ? "~" : full.slice(0, slash);
        const name = full.slice(slash + 1);
        return listDir(dir, repos).includes(name);
}
