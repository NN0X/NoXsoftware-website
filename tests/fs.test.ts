import { describe, expect, it } from "vitest";
import type { Repo } from "../src/data/types";
import { isDir, isFile, listDir, repoOfDir, resolve } from "../src/scripts/desktop/fs";

const repo: Repo = { description: "", lang: "C", archived: false, branch: "master", last: "2026-01-01", activity: {}, log: [], tree: [["src", true], ["README.md", false]] };
const REPOS: Record<string, Repo> = { Maiora: repo };

describe("shell filesystem", () =>
{
        it("resolves relative, absolute and special paths", () =>
        {
                expect(resolve("~", "~", REPOS, "projects")).toBe("~/projects");
                expect(resolve("~/projects", "~", REPOS, "maiora")).toBe("~/projects/Maiora");
                expect(resolve("~/projects/Maiora", "~", REPOS, "..")).toBe("~/projects");
                expect(resolve("~/projects/Maiora", "~", REPOS, "...")).toBe("~");
                expect(resolve("~/projects", "~/.eggs", REPOS, "-")).toBe("~/.eggs");
                expect(resolve("~/projects", "~", REPOS)).toBe("~");
        });
        it("knows which directories exist and what is in them", () =>
        {
                expect(isDir("~/projects/Maiora", REPOS)).toBe(true);
                expect(isDir("~/projects/Nope", REPOS)).toBe(false);
                expect(listDir("~/projects", REPOS)).toEqual(["Maiora/"]);
                expect(listDir("~/projects/Maiora", REPOS)).toEqual(["src/", "README.md"]);
                expect(isFile("~/projects/Maiora/README.md", REPOS)).toBe(true);
                expect(isFile("~/.zshrc", REPOS)).toBe(true);
                expect(repoOfDir("~/projects/Maiora", REPOS)).toBe("Maiora");
                expect(repoOfDir("~", REPOS)).toBeNull();
        });
});
