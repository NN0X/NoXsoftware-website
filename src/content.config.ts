import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

// One Markdown file per project and language: src/content/projects/<lang>/<slug>.md
const projects = defineCollection({
        loader: glob({ pattern: "*/*.md", base: "./src/content/projects" }),
        schema: z.object({
                sub: z.string()
        })
});

export const collections = { projects };
