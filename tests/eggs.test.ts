import { describe, expect, it } from "vitest";
import { EGGS, findEgg } from "../src/data/eggs";
import { existsSync } from "node:fs";

describe("eggs", () =>
{
        it("finds an egg by its old secret path, its slug or its page path", () =>
        {
                expect(findEgg("c++isthebest")?.slug).toBe("cpp");
                expect(findEgg("/eggs/linux/")?.path).toBe("linux>windowsallday");
                expect(findEgg("python")?.title).toMatch(/^Python/);
                expect(findEgg("eggs/")).toBeUndefined();
                expect(findEgg("/")).toBeUndefined();
        });

        it("ships the media every egg points at", () =>
        {
                for (const egg of EGGS)
                {
                        expect(existsSync("public" + egg.video), egg.video).toBe(true);
                        expect(existsSync("public" + egg.poster), egg.poster).toBe(true);
                }
        });
});
