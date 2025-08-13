# Envelopes (Owllocate) – React + TypeScript + Vite

![CI](https://github.com/Ljtol05/envelopes-clean/actions/workflows/ci.yml/badge.svg)
![Lighthouse CI](https://github.com/Ljtol05/envelopes-clean/actions/workflows/lighthouse.yml/badge.svg)
![Lighthouse Score](https://img.shields.io/badge/Lighthouse-Performance-green?logo=lighthouse)

Modern budgeting / envelopes UI built with React 19, Vite 7, TypeScript 5, Tailwind + shadcn/ui (Radix primitives), strong theming via semantic CSS vars, automated quality gates (contrast, accent-usage lint, coverage ratchet, Lighthouse), and a clean testable architecture (Jest + Testing Library).

## Key Features
* Semantic theming system (`--owl-*`) with enforced contrast & accent foreground pairing
* Auth + protected routing with optional explicit dev bypass flag
* AI onboarding actions (coach endpoints) wired through a typed API client
* Automated environment validation on dev/build
* Duplicate configuration guard (prevents drift / shadowed tool configs)
* Contrast & accent usage audits; bundle + Lighthouse performance scripts

## Quick Start
```bash
git clone <repo-url>
cd envelopes-clean
npm ci
cp .env.example .env # edit values
npm run dev
```

## Environment Variables
Defined in `.env.example` and validated by `scripts/env-validate.mjs` (runs in `predev` and `prebuild`).

| Variable | Required | Purpose |
|----------|----------|---------|
| VITE_API_BASE_URL | Yes | Backend base URL for API client. |
| VITE_REPLIT_USER_ID | Dev | Dev-only header to emulate a user (backend convenience). |
| VITE_REPLIT_USER_NAME | Dev | Display name header for backend. |
| VITE_DEV_BYPASS_AUTH | No | If `true`, ProtectedRoute allows bypass (must be intentionally enabled). |

Notes:
* Only `VITE_` prefixed vars are exposed to client via `import.meta.env`.
* Env validation will fail build in `--strict` mode if required vars missing.

## Scripts (npm run ...)
| Script | Description |
|--------|-------------|
| dev | Start Vite dev server (env validated first). |
| build | Type check (project refs) + production build. |
| preview | Preview production build. |
| lint | Duplicate config guard + ESLint flat config. |
| lint:owl | Enforce accent foreground pairing. |
| audit:contrast | Contrast audit for semantic color pairs. |
| gen:assets | Generate responsive icon set + favicon from source owl asset. |
| typecheck | Strict TS build only. |
| test | Jest (v8 coverage provider) with jsdom env. |
| audit:lighthouse | Build then run Lighthouse CI locally. |
| perf:bundle | Bundle analysis (size breakdown). |
| perf:compare | Compare two Lighthouse runs. |
| coverage:ratchet | Enforce non-decreasing coverage thresholds. |

## Duplicate Configuration Guard
Script: `scripts/check-duplicate-configs.mjs` (executed at start of `npm run lint`).

Purpose: Prevent reintroduction of legacy/duplicate config files that can silently shadow or conflict with canonical tool configs.

Canonical Files:
* Babel: `babel.config.cjs` (CommonJS needed for current Jest 28 pipeline)
* ESLint: single flat `eslint.config.js`

Guard Fails If (examples):
* `babel.config.js` / `babel.config.mjs` (only CJS canonical allowed)
* `eslint.config.cjs` or legacy `.eslintignore`
* `styleMock.js` (we keep `styleMock.cjs` for Jest)

Rationale: Ensures deterministic tooling; avoids accidental divergence when experimenting with ESM vs CJS or multiple config variants.

## Auth & Routing
* `ProtectedRoute` checks for an auth token (and optionally explicit `VITE_DEV_BYPASS_AUTH=true`).
* Dev bypass is opt-in to avoid accidental unsecured sessions.
* After registration the user is redirected into AI onboarding flow.

## Theming & Branding
Semantic CSS variables (`--owl-*`) define color tokens for light & dark modes. Theme preference stored in `localStorage` (`owl-theme`) and synced across tabs. Accent usage rules and contrast are automatically audited.

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
| Accent Hover | `--owl-accent-hover` | Teal 600 | Teal 300 (light variant) |
| Accent Foreground | `--owl-accent-fg` | Navy 900 | White |
| Success | `--owl-success` | #16A34A | #22C55E |
| Warning | `--owl-warning` | #D97706 | #F59E0B |
| Error | `--owl-error` | #DC2626 | #EF4444 |
| Focus Ring | `--owl-focus-ring` | Teal 800 | Teal 400 |

### Usage Patterns
```html
<div class="bg-[color:var(--owl-bg)] text-[color:var(--owl-text-primary)]" />
<div class="border border-[color:var(--owl-border)]" />
<button class="bg-[color:var(--owl-accent)] text-[color:var(--owl-accent-fg,var(--owl-bg))]" />
```
Rules:
* Solid accent backgrounds must include `--owl-accent-fg` text color.
* Accent as text (links, badges) allowed directly.

### Focus & Accessibility
`--owl-focus-ring` guarantees >=3:1 contrast (>=4:1 in dark). Use `focus-visible` ring utilities.

### Asset Generation
Source logo: `src/assets/branding/owl.png`
```
npm run gen:assets
```
Outputs `public/icons/owl-{size}.png|webp` + `favicon.ico`.

### Contrast & Accent Audits
* `npm run audit:contrast` – AA ratios for practical text/background pairs.
* `npm run lint:owl` – Fails on missing accent foreground with solid accent background.

## Quality & Tooling
| Area | Mechanism |
|------|-----------|
| Env correctness | `env-validate.mjs` predev/prebuild (strict on build) |
| Duplicate configs | `check-duplicate-configs.mjs` via `npm run lint` |
| Theming safety | Contrast + accent usage scripts |
| Tests | Jest 28 + babel-jest (CJS config) |
| Coverage | v8 provider + `coverage:ratchet` script |
| Performance | Lighthouse CI workflow + local bundle report |

## CI & Automation
| Workflow | Purpose |
|----------|---------|
| CI | Install, assets, typecheck, lint (ESLint + accent + contrast), tests, build. |
| Lighthouse CI | Performance / A11y / Best Practices / SEO / PWA scores on PRs. |

Dependabot weekly updates (npm + Actions). Major React updates ignored for manual review.

## Roadmap (Selected)
| Area | Next Step |
|------|-----------|
| Theming | Re-include excluded UI primitives in strict typecheck. |
| Performance | Add route-level code splitting. |
| PWA | Manifest + service worker to raise PWA score. |
| Testing | Add axe-core & more edge cases for accent/contrast. |

## Contributing
1. `npm ci`
2. (Optional) `npm run gen:assets`
3. `npm run dev`
4. Before commit Husky runs: typecheck, lint (incl. duplicate guard), lint:owl, contrast audit, tests.

## Troubleshooting
| Symptom | Action |
|---------|--------|
| Flash of un-themed content | Ensure `ThemeProvider` wraps root in `main.tsx`. |
| Accent text unreadable | Add accent foreground class or run `npm run lint:owl`. |
| Missing icons | Re-run `npm run gen:assets`. |
| Unexpected ESLint/Babel behavior | Check duplicate guard output; ensure no stray config files. |
| Auth bypass not working | Confirm `VITE_DEV_BYPASS_AUTH=true` and dev server restart. |

## GitHub Notes
* Monitor Lighthouse artifacts for performance regressions.
* Review Dependabot PRs weekly.
* Enforce coverage ratchet in CI if thresholds mature.

---
Keep this README current whenever scripts, env vars, or guard rules change.
