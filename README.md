# React + TypeScript + Vite

![CI](https://github.com/Ljtol05/envelopes-clean/actions/workflows/ci.yml/badge.svg)
![Lighthouse CI](https://github.com/Ljtol05/envelopes-clean/actions/workflows/lighthouse.yml/badge.svg)

![Lighthouse Score](https://img.shields.io/badge/Lighthouse-Performance-green?logo=lighthouse)

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
  ## Owllocate Theming & Branding

  ### Overview
  The app uses semantic CSS variables (prefixed `--owl-*`) for all color tokens with light and dark themes plus a persistent user preference (localStorage) and system fallback. A `ThemeProvider` applies variables to `:root` and toggling is handled by `ThemeToggle`.

  ### Token Contract
  | Semantic | CSS Var | Light | Dark |
  |----------|---------|-------|------|
  | Background | `--owl-bg` | White | Navy 800 |
  | Surface | `--owl-surface` | Gray 50 | Navy 700 |
  | Surface Alt | `--owl-surface-alt` | White | Navy 600 |
  | Text Primary | `--owl-text-primary` | Navy 800 | White |
  | Text Secondary | `--owl-text-secondary` | Gray 600 | Gray 300 |
  | Border | `--owl-border` | Gray 200 | Navy 600 |
  | Accent | `--owl-accent` | Teal 500 (#45D0C7) | Teal 500 (#45D0C7) |
  | Accent Hover | `--owl-accent-hover` | Teal 600 | Teal 300/Light variant |
  | Accent Foreground | `--owl-accent-fg` | Navy 900 | White |
  | Success | `--owl-success` | #16A34A | #22C55E |
  | Warning | `--owl-warning` | #D97706 | #F59E0B |
  | Error | `--owl-error` | #DC2626 | #EF4444 |
  | Focus Ring | `--owl-focus-ring` | Teal 800 | Teal 400 |

  ### Usage Patterns (Tailwind + Arbitrary Values)
  Examples:
  ```
  <div className="bg-[color:var(--owl-bg)] text-[color:var(--owl-text-primary)]" />
  <div className="border border-[color:var(--owl-border)]" />
  <button className="bg-[color:var(--owl-accent)] text-[color:var(--owl-accent-fg,var(--owl-bg))]" />
  ```

  Consistent forms:
  - Background: `bg-[color:var(--owl-bg)]`, surfaces: `bg-[color:var(--owl-surface)]` / `-surface-alt`.
  - Text: `text-[color:var(--owl-text-primary)]` or `-text-secondary`.
  - Accent text (not background): `text-[color:var(--owl-accent)]` is allowed for links/badges.
  - Accent background (solid) MUST include `text-[color:var(--owl-accent-fg,var(--owl-bg))]`.

  ### Accent Foreground Rule
  When `--owl-accent` is used as a solid background (no opacity modifier like `/10`) always pair with `--owl-accent-fg`. A custom script `npm run lint:owl` enforces this.

  ### Theme Toggle
  `ThemeToggle` switches between light/dark themes. Preference stored in `localStorage` (`owl-theme`). If none set, system `prefers-color-scheme` decides initial value. Cross-tab sync keeps multiple windows aligned.

  ### Focus Visibility
  `--owl-focus-ring` ensures minimum 3:1 contrast against background (4:1+ in dark). Apply via utility classes such as `focus:outline-none focus-visible:ring-2 ring-[color:var(--owl-focus-ring)]` (configure ring plugin or use arbitrary styles).

  ### Assets & Logo
  Source logo: `src/assets/branding/owl.png` (keep as raster). Generate responsive assets:
  ```
  npm run gen:assets
  ```
  Outputs: `public/icons/owl-{size}.png|webp` and `favicon.ico`.

  #### `<picture>` Example
  ```
  <picture>
    <source type="image/webp" srcSet="/icons/owl-128.webp 128w, /icons/owl-256.webp 256w" />
    <source type="image/png" srcSet="/icons/owl-128.png 128w, /icons/owl-256.png 256w" />
    <img src="/icons/owl-128.png" width="128" height="128" alt="Owllocate" />
  </picture>
  ```
  The actual implementation lives in `OwllocateLogo.tsx` and includes more sizes.

  ### Contrast Audit
  Run:
  ```
  npm run audit:contrast
  ```
  Reports AA contrast ratios for practical text pairs and focus ring. Non-text decorative accent usages are excluded.

  ### Custom Lint (Accent Usage)
  `npm run lint:owl` scans for solid accent backgrounds lacking accent foreground text class. CI should invoke this to prevent regressions.

  ### Adding New Tokens
  1. Add to `Theme` interface in `src/theme/colors.ts`.
  2. Populate in `darkTheme` & `lightTheme`.
  3. Expose CSS var in `applyWebCssVariables` (theme/index.tsx).
  4. Provide fallbacks in `globals.css`.
  5. Document here.

  ### Troubleshooting
  | Issue | Check |
  |-------|-------|
  | Flash of un-themed content | Ensure `ThemeProvider` wraps root (`main.tsx`). |
  | Accent text illegible | Missing `accent-fg` class on solid accent background. Run `npm run lint:owl`. |
  | Icons missing | Re-run `npm run gen:assets` after adding `owl.png`. |
  | Contrast fail reported | Confirm color pair is truly textual; otherwise update audit script pairs. |

  ### Scripts Summary
  | Script | Purpose |
  |--------|---------|
  | `gen:assets` | Generate PNG/WebP icons + favicon from owl.png. |
  | `audit:contrast` | AA contrast audit for practical pairs. |
  | `lint:owl` | Enforce accent background foreground pairing. |

  ---
  End of theming documentation.

  ## CI & Automation

  ### Workflows
  | Workflow | File | Purpose |
  |----------|------|---------|
  | CI | `.github/workflows/ci.yml` | Install, generate assets, typecheck, lint (ESLint + accent rule + contrast), build, upload contrast report. |
  | Lighthouse CI | `.github/workflows/lighthouse.yml` | Runs Lighthouse (Performance, A11y, Best Practices, SEO, PWA) on PRs and uploads reports. |

  ### Dependabot
  Managed via `.github/dependabot.yml` with weekly updates (npm + GitHub Actions). React major updates are ignored to allow manual review. Minor/patch updates grouped.

  ### Local Quality Scripts
  | Command | Description |
  |---------|-------------|
  | `npm run typecheck` | Strict TypeScript build (UI primitives currently excluded). |
  | `npm run lint` | ESLint (configure to be type-aware if desired). |
  | `npm run lint:owl` | Custom accent foreground pairing guard. |
  | `npm run audit:contrast` | Contrast ratio audit (AA) for practical text pairs. |
  | `npm test` | Jest + Testing Library (theme persistence tests). |
  | `npm run gen:assets` | Generate responsive raster + favicon assets from `owl.png`. |
  | `npm run audit:lighthouse` | Build then run Lighthouse CI locally (reports in `.lighthouseci`). |

  ### Lighthouse CI (Local)
  1. Ensure a production build: `npm run build`
  2. Run: `npm run audit:lighthouse`
  3. View HTML reports in `.lighthouseci` (Performance, Accessibility, PWA, etc.).

  Thresholds (warn/error) enforced via `lighthouserc.json` assertions. Adjust scores as the project matures.

  ### PWA Notes
  PWA category audited; to raise scores add a Web App Manifest and service worker (not yet included). Once added, tune Lighthouse PWA assertions.

  ## Roadmap / Next Steps
  | Area | Next Step |
  |------|-----------|
  | Theming | Potentially re-include UI primitives in typecheck once external deps typed. |
  | Performance | Add code-splitting & route-based chunks. |
  | PWA | Add manifest + service worker, raise PWA minScore. |
  | Testing | Expand tests for contrast enforcement and accent lint edge cases. |
  | Accessibility | Add axe-core integration in tests for critical screens. |

  ## Contributing
  1. Install deps: `npm ci`
  2. Generate assets (optional): `npm run gen:assets`
  3. Run dev server: `npm run dev`
  4. Before committing, Husky runs: typecheck, eslint, lint:owl, contrast audit, tests.

  ## Repository Setup (New Clone)
  ```
  git clone <repo-url>
  cd envelopes-clean
  npm ci
  npm run dev
  ```

  ## Environment variables (.env)

  Create a .env (or .env.local) at the project root for Vite.

  - VITE_API_BASE_URL: Base URL for the backend API used by src/lib/api.ts.
    - Example: https://envelopes-backend-ashb786.replit.dev
  - VITE_REPLIT_USER_ID: Dev-only header to emulate a user in Replit backend.
    - Example: test-user-123
  - VITE_REPLIT_USER_NAME: Dev-only header to pass a display name to backend.
    - Example: testuser

  Notes
  - Vite exposes only variables prefixed with VITE_ to the client code (via import.meta.env).
  - These headers are added automatically by the API client during development to help the Replit backend identify requests.
  - Restart dev server after changing env vars.

  ## GitHub Setup Notes
  After pushing the initial commit:
  1. Enable GitHub Pages (if desired) pointing to a deploy workflow (not yet included).
  2. Review Dependabot PRs weekly.
  3. Monitor CI & Lighthouse artifacts for regressions.



      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
