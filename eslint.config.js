import globals from "globals";
import tseslint from "typescript-eslint";
import stylistic from "@stylistic/eslint-plugin";
import astro from "eslint-plugin-astro";

// House style, same as the C/C++ repos (see TDC2/.clang-format and .clang-tidy):
// Allman braces, 8-space indent, camelCase functions and variables, PascalCase types.
const style = {
        "@stylistic/brace-style": ["error", "allman", { allowSingleLine: true }],
        "@stylistic/indent": ["error", 8, { SwitchCase: 1 }],
        "@stylistic/quotes": ["error", "double", { avoidEscape: true }],
        "@stylistic/semi": ["error", "always"],
        "@stylistic/comma-dangle": ["error", "never"],
        "@stylistic/no-trailing-spaces": "error",
        "@stylistic/eol-last": "error",
        "@typescript-eslint/naming-convention": [
                "error",
                { selector: "function", format: ["camelCase"] },
                { selector: "typeLike", format: ["PascalCase"] },
                { selector: "variable", format: ["camelCase", "UPPER_CASE"], leadingUnderscore: "allow" },
                { selector: "parameter", format: ["camelCase"], leadingUnderscore: "allow" }
        ]
};

export default [
        { ignores: ["dist/", ".astro/", "docs/", "node_modules/", "public/"] },
        ...tseslint.configs.recommended,
        ...astro.configs.recommended,
        {
                files: ["**/*.{js,mjs,ts}"],
                languageOptions: { globals: { ...globals.browser, ...globals.node } },
                plugins: { "@stylistic": stylistic },
                rules: style
        }
];
