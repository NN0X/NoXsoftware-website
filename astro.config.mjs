import { defineConfig } from "astro/config";

// Static output only: Apache on the Raspberry Pi serves dist/ as plain files.
export default defineConfig({
        site: "https://noxsoftware.pl",
        output: "static",
        trailingSlash: "always",
        build: {
                format: "directory"
        },
        i18n: {
                defaultLocale: "en",
                locales: ["en", "pl"],
                routing: {
                        prefixDefaultLocale: false
                }
        }
});
