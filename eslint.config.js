// Flat ESLint config with TypeScript, React, and Jest support
import js from "@eslint/js";
import globals from "globals";
import reactRefresh from "eslint-plugin-react-refresh";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default [
  // Global ignores (replaces .eslintignore)
  {
  ignores: ["coverage/**", "dist/**", "public/**", "eslint.config.cjs"],
  },

  // Base JS recommendations
  js.configs.recommended,

  // TypeScript parser + rules
  ...tseslint.configs.recommended,

  // App source: React rules and browser globals
  {
    files: ["src/**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      parserOptions: { ecmaVersion: "latest", sourceType: "module", ecmaFeatures: { jsx: true } },
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
    plugins: {
      "react-refresh": reactRefresh,
      "react-hooks": reactHooks,
    },
    rules: {
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      ...reactHooks.configs.recommended.rules,
    },
  },

  // Node/config files
  {
    files: [
      "**/*.js",
      "**/*.cjs",
      "**/*.mjs",
      "scripts/**/*.mjs",
      "styleMock.js",
      "jest.config.cjs",
      "**/babel.config.js",
      "**/metro.config.js",
      "postcss.config.mjs",
    ],
    languageOptions: {
      parserOptions: { ecmaVersion: "latest", sourceType: "module" },
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },

  // Tests: add Jest globals
  {
    files: [
      "src/**/*.{test,spec}.{ts,tsx,js,jsx}",
      "src/__tests__/**/*.{ts,tsx,js,jsx}",
    ],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },
];
