// Pulls everything the site shows about each repository, so nothing has to be maintained by hand.
//
//      npm run data                    list repos via the GitHub API, then read each one with git
//      npm run data -- --repos a,b,c   skip the API (offline, or where the API is not reachable)
//
// Repos are cloned bare with --filter=blob:none into .cache/repos: history and trees only, and file
// contents are fetched on demand for the few excerpt files. The result goes to src/data/repos.json,
// which is committed so the site also builds without network access.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const CONFIG = JSON.parse(readFileSync(join(ROOT, "src/data/projects.json"), "utf8"));
const OUT = join(ROOT, "src/data/repos.json");
const CACHE = join(ROOT, ".cache/repos");
const LOG_LENGTH = 6;
const EXTENSIONS = {
        c: "C",
        cpp: "C++", cc: "C++", cxx: "C++", hpp: "C++", hh: "C++", inl: "C++",
        py: "Python", php: "PHP", sh: "Shell", ts: "TypeScript", js: "JavaScript",
        java: "Java", html: "HTML"
};
const VENDORED = /^(include\/(glm|glaze|raylib)|lib|third_party|vendor|node_modules)\//;

function git(repoDir, ...args)
{
        return execFileSync("git", ["-C", repoDir, ...args], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
}

function previousSnapshot()
{
        if (!existsSync(OUT))
        {
                return { repos: {} };
        }
        return JSON.parse(readFileSync(OUT, "utf8"));
}

async function listFromApi()
{
        const headers = { "Accept": "application/vnd.github+json", "User-Agent": "noxsoftware-site-build" };
        if (process.env.GITHUB_TOKEN)
        {
                headers.Authorization = "Bearer " + process.env.GITHUB_TOKEN;
        }
        const res = await fetch("https://api.github.com/users/" + CONFIG.githubUser + "/repos?per_page=100&type=owner", { headers });
        if (!res.ok)
        {
                throw new Error("GitHub API answered " + res.status);
        }
        const list = await res.json();
        return list.filter((r) => !r.fork && !r.private && !CONFIG.excludeRepos.includes(r.name)).map((r) => ({ name: r.name, description: r.description || "", language: r.language || "", archived: r.archived }));
}

function listFromArgs(previous)
{
        const arg = process.argv.indexOf("--repos");
        const names = arg !== -1 ? process.argv[arg + 1].split(",") : Object.keys(previous.repos);
        return names.filter((n) => n && !CONFIG.excludeRepos.includes(n)).map((name) =>
        {
                const old = previous.repos[name] || {};
                return { name, description: old.description || "", language: "", archived: Boolean(old.archived) };
        });
}

function syncRepo(name)
{
        const dir = join(CACHE, name + ".git");
        const url = "https://github.com/" + CONFIG.githubUser + "/" + name + ".git";
        if (existsSync(dir))
        {
                git(dir, "fetch", "--quiet", "--force", "origin", "+HEAD:HEAD");
        }
        else
        {
                execFileSync("git", ["clone", "--quiet", "--bare", "--filter=blob:none", url, dir]);
        }
        return dir;
}

function guessLanguage(dir)
{
        const counts = {};
        for (const path of git(dir, "ls-tree", "-r", "--name-only", "HEAD").split("\n"))
        {
                const ext = path.split(".").pop().toLowerCase();
                if (!path || VENDORED.test(path) || !EXTENSIONS[ext])
                {
                        continue;
                }
                counts[EXTENSIONS[ext]] = (counts[EXTENSIONS[ext]] || 0) + 1;
        }
        // .h belongs to whichever of C and C++ the repo actually compiles
        const headers = git(dir, "ls-tree", "-r", "--name-only", "HEAD").split("\n").filter((p) => p.endsWith(".h") && !VENDORED.test(p)).length;
        const owner = (counts["C++"] || 0) >= (counts.C || 0) && counts["C++"] ? "C++" : "C";
        if (headers && (counts.C || counts["C++"]))
        {
                counts[owner] += headers;
        }
        const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
        return best ? best[0] : "";
}

function readRepo(meta, excerpt)
{
        const dir = syncRepo(meta.name);
        const activity = {};
        for (const month of git(dir, "log", "--format=%ad", "--date=format:%Y-%m").split("\n").filter(Boolean))
        {
                activity[month] = (activity[month] || 0) + 1;
        }
        const log = git(dir, "log", "-" + LOG_LENGTH, "--no-merges", "--format=%h%x09%ad%x09%s", "--date=short").split("\n").filter(Boolean).map((line) => line.split("\t"));
        const tree = git(dir, "ls-tree", "HEAD").split("\n").filter(Boolean).map((line) =>
        {
                const [info, name] = line.split("\t");
                return [name, info.split(" ")[1] === "tree"];
        }).sort((a, b) => (a[1] === b[1] ? a[0].localeCompare(b[0], "en", { sensitivity: "base" }) : (a[1] ? -1 : 1)));
        const repo = {
                description: meta.description,
                lang: meta.language || guessLanguage(dir),
                archived: meta.archived,
                branch: git(dir, "symbolic-ref", "--short", "HEAD").trim(),
                last: git(dir, "log", "-1", "--format=%ad", "--date=short").trim(),
                activity: Object.fromEntries(Object.entries(activity).sort()),
                log,
                tree
        };
        if (excerpt)
        {
                const lines = git(dir, "show", "HEAD:" + excerpt.path).split("\n").slice(excerpt.from - 1, excerpt.to);
                repo.excerpt = { path: excerpt.path, from: excerpt.from, lang: excerpt.lang, code: lines.join("\n").replace(/\t/g, "        ") };
        }
        return repo;
}

async function main()
{
        const previous = previousSnapshot();
        let metas;
        if (process.argv.includes("--repos"))
        {
                metas = listFromArgs(previous);
        }
        else
        {
                try
                {
                        metas = await listFromApi();
                }
                catch (err)
                {
                        console.warn("Falling back to the previous repo list: " + err.message);
                        metas = listFromArgs(previous);
                }
        }
        mkdirSync(CACHE, { recursive: true });
        const excerpts = Object.fromEntries(CONFIG.projects.map((p) => [p.repo, p.excerpt]));
        const repos = {};
        for (const meta of metas.sort((a, b) => a.name.localeCompare(b.name)))
        {
                try
                {
                        repos[meta.name] = readRepo(meta, excerpts[meta.name]);
                        console.log("ok   " + meta.name);
                }
                catch (err)
                {
                        console.warn("skip " + meta.name + ": " + err.message.split("\n")[0]);
                        if (previous.repos[meta.name])
                        {
                                repos[meta.name] = previous.repos[meta.name];
                        }
                }
        }
        for (const p of CONFIG.projects)
        {
                if (!repos[p.repo])
                {
                        throw new Error("Featured project " + p.repo + " is missing from the data");
                }
        }
        writeFileSync(OUT, JSON.stringify({ generated: new Date().toISOString().slice(0, 10), user: CONFIG.githubUser, repos }, null, 1) + "\n");
        console.log("wrote " + Object.keys(repos).length + " repos to src/data/repos.json");
}

await main();
