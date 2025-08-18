# Envelopes (Owllocate) – React + TypeScript + Vite

![CI](https://github.com/Ljtol05/envelopes-clean/actions/workflows/ci.yml/badge.svg)
![Lighthouse CI](https://github.com/Ljtol05/envelopes-clean/actions/workflows/lighthouse.yml/badge.svg)
![Lighthouse Score](https://img.shields.io/badge/Lighthouse-Performance-green?logo=lighthouse)

Modern budgeting / envelopes UI built with React 19, Vite 7, TypeScript 5, Tailwind + shadcn/ui (Radix primitives), strong theming via semantic CSS vars, automated quality gates (contrast, accent-usage lint, coverage ratchet, Lighthouse), and a clean testable architecture (Jest + Testing Library).

## Table of Contents
1. [Key Features](#key-features)
2. [Quick Start](#quick-start)
3. [Environment Variables](#environment-variables)
4. [Scripts](#scripts-npm-run-)
5. [Auth & Routing](#auth--routing)
6. [Theming & Branding](#theming--branding)
7. [Quality & Tooling](#quality--tooling)
8. [CI & Automation](#ci--automation)
9. [Roadmap](#roadmap-selected)
10. [Contributing](#contributing)
11. [Troubleshooting](#troubleshooting)
12. [Backend API Reference](#backend-api-reference-envelopes-backend)
	* [Sample Responses](#sample-responses)
	* [Real-time Events](#real-time-events)
13. [GitHub Notes](#github-notes)
14. [Environment & API Diagnostics](#environment--api-diagnostics)
15. [Endpoint Diagnostics Panel](#endpoint-diagnostics-panel)
16. [Address Autocomplete & KYC UX](#address-autocomplete--kyc-ux)

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
Centralized reference for all frontend runtime variables. Defined in `.env.example` and validated by `scripts/env-validate.mjs` (runs automatically in `predev` and `prebuild`).

### Core
| Variable | Required | Purpose |
|----------|----------|---------|
| VITE_API_URL | Prod* | Canonical backend base URL (e.g. `https://envelopes-backend.ashb786.repl.co/api`). Optional in dev (falls back to `http://localhost:5000`). |
| VITE_API_BASE_URL | Legacy | Deprecated alias (only read if `VITE_API_URL` unset). Will be removed in a future release. |
| VITE_EVENTS_URL | No | SSE events stream URL (defaults to `${VITE_API_URL || VITE_API_BASE_URL}/events` if unset). |
| VITE_*_ENDPOINT (auth/core/AI overrides) | No | Optional fine-grained endpoint path overrides (see below). Use rarely—prefer backend defaults. |

### Developer / Convenience
| Variable | Required | Purpose |
|----------|----------|---------|
| VITE_REPLIT_USER_ID | Dev | Simulate a Replit user (header passthrough for backend multi-user testing). |
| VITE_REPLIT_USER_NAME | Dev | Display name for simulated user. |
| VITE_DEV_BYPASS_AUTH | No | Enables guarded dev bypass for protected routes. Must be consciously enabled. |

### Environment / Misc
| Variable | Required | Purpose |
|----------|----------|---------|
| VITE_NODE_ENV | No | Explicit environment override (mirrors `import.meta.env.MODE`). |
| VITE_GOOGLE_PLACES_API_KEY | No | Enables Google Places Autocomplete + Place Details enrichment on the KYC form (address autofill). Gracefully optional. |
| VITE_PLACES_PROXY_BASE | No | Frontend will call this base (e.g. `http://localhost:5055`) instead of Google directly; pair with `npm run places:proxy`. |

### Example `.env`
```env
# Preferred new variable name
VITE_API_URL=https://envelopes-backend.ashb786.repl.co/api
# For local backend development:
# VITE_API_URL=http://localhost:5000/api

# (Optional) Legacy alias still recognized if VITE_API_URL is absent
# VITE_API_BASE_URL=https://envelopes-backend.ashb786.repl.co/api

# Optional real-time events (SSE) (falls back automatically if omitted)
# VITE_EVENTS_URL=https://envelopes-backend.ashb786.repl.co/api/events

# Dev helpers
VITE_REPLIT_USER_ID=123
VITE_REPLIT_USER_NAME=Dev User
# VITE_DEV_BYPASS_AUTH=true

# Optional address autocomplete (Google Places)
# VITE_GOOGLE_PLACES_API_KEY=YOUR_KEY_HERE

# (Optional) Individual endpoint overrides (defaults shown). Uncomment to customize only if backend path differs.
# VITE_REGISTER_ENDPOINT=/api/auth/register
# VITE_LOGIN_ENDPOINT=/api/auth/login
# VITE_VERIFY_EMAIL_ENDPOINT=/api/auth/verify-email
# VITE_RESEND_EMAIL_ENDPOINT=/api/auth/resend-verification
# VITE_START_PHONE_VERIFICATION_ENDPOINT=/api/auth/start-phone-verification
# VITE_VERIFY_PHONE_ENDPOINT=/api/auth/verify-phone
# VITE_RESEND_PHONE_ENDPOINT=/api/auth/resend-phone-code
# VITE_FORGOT_PASSWORD_ENDPOINT=/api/auth/forgot-password
# VITE_RESET_PASSWORD_ENDPOINT=/api/auth/reset-password
# VITE_ME_ENDPOINT=/api/auth/me
# VITE_START_KYC_ENDPOINT=/api/kyc/start
# VITE_KYC_STATUS_ENDPOINT=/api/kyc/status
# VITE_ENVELOPES_ENDPOINT=/api/envelopes
# VITE_TRANSACTIONS_ENDPOINT=/api/transactions
# VITE_TRANSFERS_ENDPOINT=/api/transfers
# VITE_CARDS_ENDPOINT=/api/cards
# VITE_RULES_ENDPOINT=/api/rules
# VITE_EVENTS_ENDPOINT=/api/events
# VITE_AI_COACH_ENDPOINT=/api/ai/coach
# (Legacy alias accepted: VITE_AI_CHAT_ENDPOINT)
# VITE_AI_SETUP_ENDPOINT=/api/ai/setup-envelopes
# VITE_AI_EXECUTE_ENDPOINT=/api/ai/execute-action
# VITE_AI_EXPLAIN_ROUTING_ENDPOINT=/api/ai/explain-routing
```

### Validation Notes
* Only `VITE_` prefixed vars are exposed to the client.
* Validation script can be tightened to fail missing optional dev vars in CI (currently soft).
* Keep this section authoritative—other references (e.g. Backend API section) point here.

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
Progressive verification pipeline (frontend enforced):
1. Email verification (must succeed first)
2. Phone verification (required by default – can be disabled via env)
3. KYC identity verification
4. Full app / AI features

Guards:
* `VerificationGuard` + `OnboardingRedirect` orchestrate required step redirects.
* `PHONE_VERIFICATION_REQUIRED` constant (in `src/lib/onboarding.ts`) defaults to `true` unless `VITE_REQUIRE_PHONE_VERIFICATION="false"` is explicitly set (string literal false).
* Setting `VITE_REQUIRE_PHONE_VERIFICATION=false` (in `.env`) collapses flow to Email -> KYC.

Backend-driven step routing:
* Auth endpoints (`/login`, `/verify-email`, `/verify-phone`) can return two optional fields: `verificationStep` (current achieved stage) and `nextStep` (explicit required next action).
* A small helper `nextRouteFromSteps(nextStep, verificationStep)` (see `src/lib/authRouting.ts`) normalizes these into the client route.
* Priority: `nextStep` if present, otherwise `verificationStep`; unknown/omitted values default to `/auth/kyc` as a safe gate; `complete` maps to `/home`.

Token & user propagation:
* Both email and phone verification endpoints may return a `token` and/or updated `user` object. The pages call a shared `applyAuth` helper (AuthContext) to persist the token (localStorage `auth_token`).
* For compatibility with backend docs / external snippets, the token is also mirrored under a generic `token` key. The Axios interceptor looks up `auth_token` first, then falls back to `token` so either storage key works for `Authorization: Bearer <token>`.
* Interceptor validated in `src/__tests__/apiInterceptor.test.ts` (ensures header injected, no Authorization when missing).

### Phone Verification & Twilio Formatting

Phone numbers are now parsed & normalized with `libphonenumber-js` for robust international support, then sent in E.164 format (Twilio‑friendly) to:
* `POST /api/auth/start-phone-verification`
* `POST /api/auth/verify-phone`
* `POST /api/auth/resend-phone-code`

UI Enhancements:
* Country selector (Radix Select) defaults to US; user can change before entering a number.
* When user types national digits (no leading `+`), we automatically prepend the selected country's calling code before parsing.
* A live "Will send: +123456..." preview shows the computed E.164 or an error state.
* Layout centered for clearer progressive auth UX.

Utilities: `src/lib/phone.ts`
* `formatPhoneE164(raw, { defaultCountry })` – Attempts library parse (international or national with provided default). Returns canonical `+E.164` or `null`.
* `autoPrependCountry(raw, country)` – If the user typed a national number without `+`, produce a candidate `+<countryCode><digits>` prior to parsing.
* `getCountryOptions()` – Country metadata (`code`, `name`, `callingCode`, emoji `flag`) for building the selector (prioritizes common countries first).
* `isLikelyE164(phone)` – Lightweight regex gate (`^\+[1-9]\d{9,14}$`).

Fallback Heuristic:
If library parsing fails (e.g. partially entered but plausibly valid international digits starting with `+`), we retain a minimal validation path that accepts `+` followed by 10–15 digits (no leading zero after plus). This keeps UX forgiving while still guiding to valid formats.

Service Payloads:
All phone endpoints send both `phone` and `phoneNumber` fields for backward compatibility with earlier backend expectations.

Examples (raw input → normalized E.164):
```
"(689) 224-3543"        -> +16892243543   (auto country prepend US)
"6892243543"            -> +16892243543   (plain national digits)
"+1 689 224 3543"       -> +16892243543   (already international)
"020 7123 4567" (GB)    -> +442071234567  (after switching selector to UK)
"+44 20 7123 4567"      -> +442071234567
"+918888777666"         -> +918888777666  (India)
```
Rejected examples:
```
"12345"                 // too short
"+000123456789"         // invalid country code pattern
"0044 20 7123 4567"     // user must use + or select country (leading 00 not accepted directly)
```

Tests:
* `phoneUtil.test.ts` – Parsing, auto-prepend, validation across multiple countries.
* `PhoneVerificationFlow.test.tsx` – Ensures normalized `+E.164` is sent for varied raw formats and that service calls fire once valid.

Implementation Notes:
* We do not guess an E.164 for arbitrary 10–15 digit strings without context—callers first apply `autoPrependCountry` with the selected country for national input.
* Library parsing ensures region-specific length & pattern validation; the fallback only accepts clearly formed international digit strings.
* The previous custom regex heuristic has been fully replaced; docs updated accordingly.

Throttling / multiple navigation prevention:
* Login / Register pages use a `useRef` latch (`redirectedRef`) so redirect side-effects only fire once after hydration and verification conditions are satisfied.
* `PhoneVerificationPage` and `OnboardingRedirect` also guard repeated `navigate` calls with a ref to avoid React Router's "navigation throttled" warnings.
* If you add new onboarding steps, follow the same pattern: compute target route, check a ref flag, then navigate inside an effect.

KYC status:
* After earlier steps the app queries `/api/kyc/status`; non-approved status routes user to `/auth/kyc` until approved (`approved` then unlocks `/home`).

Dev bypass:
* `ProtectedRoute` respects `VITE_DEV_BYPASS_AUTH=true` (opt-in) for local iteration without performing the verification flow.

Endpoint resolution:
* All auth, KYC, core resource, realtime events, and AI feature paths funnel through `src/config/endpoints.ts` which maps optional per-endpoint `VITE_*` overrides to defaults. Legacy alias `VITE_AI_CHAT_ENDPOINT` still maps to the coach endpoint if `VITE_AI_COACH_ENDPOINT` is unset.

### Forgot & Reset Password

Flow Overview:
1. User enters their email on the "Forgot Password" screen.
2. Frontend calls `POST /api/auth/forgot-password` (or overridden `VITE_FORGOT_PASSWORD_ENDPOINT`).
3. UI always advances to the reset step with a generic success message (prevents email enumeration) regardless of whether the email exists.
4. User supplies the 6‑digit code received (or tests with a mocked value), a new password, and confirmation.
5. Frontend calls `POST /api/auth/reset-password` (or overridden `VITE_RESET_PASSWORD_ENDPOINT`) with `{ email, code, newPassword }`.
6. On success, user sees a completion card and can return to login.

Security / UX Notes:
* Generic message: The forgot endpoint intentionally normalizes failures to a generic "If an account exists..." response to thwart account enumeration.
* Error specificity is only shown during the reset step (e.g. invalid / expired code) since the user has already demonstrated knowledge of the email address.
* No token manipulation: Resetting password does not implicitly log the user in; they must authenticate afterwards.
* Minimum password length enforced client-side (>= 8 chars) with basic match validation; server should enforce additional complexity / reuse policies.

Environment Overrides:
* `VITE_FORGOT_PASSWORD_ENDPOINT` (default `/api/auth/forgot-password`)
* `VITE_RESET_PASSWORD_ENDPOINT` (default `/api/auth/reset-password`)

Testing:
* `ForgotResetPassword.test.tsx` covers: email submission → reset step, password mismatch guard, successful reset, invalid code error surface.
* Service wrappers: `forgotPassword()` coerces all errors into a generic message; `resetPassword()` surfaces server-provided error messages (e.g. `Invalid code`).

Server Expectations:
* Forgot: Accepts `{ email }` and should always return 200 with a uniform message even if the account does not exist.
* Reset: Accepts `{ email, code, newPassword }` and returns success message or an error with `message` field for display (e.g. invalid / expired code, weak password).

## Address Autocomplete & KYC UX

The KYC form uses a lightweight Google Places integration to reduce manual input:

Features
* Debounced address line 1 suggestions via direct HTTPS fetch (no SDK script tag).
* Selecting a suggestion triggers a Place Details fetch to populate: line1 (street number + route), city, state (short), postal code.
* ZIP fallback: if user types a 5 digit ZIP and city/state blank, `lookupZip` (Zippopotam.us) fills them.
* Capped in‑memory caches for suggestions, place details, and ZIP lookups (size 50 / 100) for snappy UX and quota conservation.
* Google attribution line required by Maps Platform.
* Age (18+) validation and DOB auto‑formatter (digits → YYYY-MM-DD) to reduce error friction.
* First/Last name auto‑prefill from `user.name` when both blank.

Env Variable
* `VITE_GOOGLE_PLACES_API_KEY` optional; if absent, suggestions silently return `[]` (user still completes form manually).

Core Utilities
* `src/lib/addressAutocomplete.ts` – fetchAddressSuggestions / fetchPlaceDetails / applySuggestion + caches.
* `src/lib/zipLookup.ts` – public ZIP → city/state fallback with caching.

Tests
* `addressAutocomplete.test.ts` – query guard, parsing & caching, details extraction, non‑destructive merging.
* `KycFlow.test.tsx` – overall screen integration stays stable.

Why add (and now use) a server proxy?
1. Hide the real key (harder to abuse even with referrer restrictions).
2. Central rate limiting + logging, anomaly detection.
3. Easier rotation & multi‑provider abstraction.
4. Response trimming / normalization server‑side.
5. Potential to attach authenticated user context to audit usage.

Implemented Minimal Proxy
* File: `server/placesProxy.mjs` (start with `npm run places:proxy`).
* Endpoints:
	* `GET /places/autocomplete?q=...&country=us&limit=5&sessiontoken=...`
	* `GET /places/details/:id?sessiontoken=...`
* Adds lightweight in-memory TTL cache (2m) and propagates session tokens.
* Set `VITE_PLACES_PROXY_BASE=http://localhost:5055` to enable from the client.
* Hardening TODO (prod): auth, rate limiting, structured logging, stricter CORS, provider abstraction.

Failure Handling
* Network or quota errors: fall back to manual entry; optional subtle UI notice if persistent.

Enhancements (Implemented)
* Keyboard arrow navigation (Up/Down/Enter/Escape) for suggestion list.
* Single Places session token reused across autocomplete + details for improved relevance & billing grouping.
Remaining
* Internationalization (current heuristic tuned for US addresses).

Privacy Note
* Avoid storing full user-entered address queries with PII unless required; consider hashing or truncating at persistence layer.

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
| Runtime error: base API URL is not configured | Supply `VITE_API_URL` (preferred) or legacy `VITE_API_BASE_URL`, then restart dev. |
| 401 Unauthorized on known good creds | Confirm headers: Authorization Bearer token and (if dev) Replit x-replit-* values present. |

## GitHub Notes
* Monitor Lighthouse artifacts for performance regressions.
* Review Dependabot PRs weekly.
* Enforce coverage ratchet in CI if thresholds mature.

---
Keep this README current whenever scripts, env vars, or guard rules change.

## Endpoint Diagnostics Panel
The optional floating panel that enumerates all resolved endpoint paths is useful for quickly verifying per-endpoint overrides and spotting legacy env usage.

Enable it by setting in your `.env`:
```
VITE_SHOW_ENDPOINT_DIAGNOSTICS=true
```
Then restart `npm run dev`. A small "Endpoints ▼" button appears bottom-left:

* Toggle open to view each endpoint key (e.g. `login`, `aiCoach`) with its resolved path.
* The Env Source column shows the specific `VITE_*_ENDPOINT` variable used if you overrode the default.
* Legacy notices appear in amber if you're still relying on deprecated aliases (e.g. `VITE_API_BASE_URL`, `VITE_AI_CHAT_ENDPOINT`).

### When to Use
* Backend changed a route and you added a temporary override – confirm it's picked up.
* Debugging a 404 – ensure the path matches what the backend expects.
* Auditing cleanup – remove per-endpoint overrides once backend matches defaults (panel should then show blank Env Source values).

### Acting on Warnings / Errors
| Panel Message | Action |
|---------------|--------|
| `Legacy VITE_API_BASE_URL in use` | Rename variable to `VITE_API_URL` and remove the legacy one. |
| `Legacy VITE_AI_CHAT_ENDPOINT in use` | Replace with `VITE_AI_COACH_ENDPOINT`. |
| Unexpected path (you didn't set an override) | Search your `.env` for a stray `VITE_*_ENDPOINT` or inspect build-time replacement (restart dev server). |
| 404 responses despite correct path | Check backend deployment base URL / health; verify leading `/api` consistency. |

Disable the panel by setting `VITE_SHOW_ENDPOINT_DIAGNOSTICS=false` (default) or omitting the variable (production builds should keep it disabled). The component is gated at runtime and tree-shaken from prod bundles when the flag is false.

## Backend API Reference (envelopes-backend)
The deployed Replit backend (name: `envelopes-backend`, username: `ashb786`) exposes the following REST endpoints. Base URL examples:

Production (Replit):
```
https://envelopes-backend.ashb786.repl.co/api
```
Local dev:
```
http://localhost:5000/api
```

All authenticated requests require header:
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Environment Variables
See consolidated [Environment Variables](#environment-variables) section. Prefer `VITE_API_URL`; `VITE_API_BASE_URL` is a transitional alias.

### Authentication & User Management
| Method & Path | Purpose | Body (JSON) |
|---------------|---------|-------------|
| POST `/api/auth/register` | Register new user | `{ name, email, password }` |
| POST `/api/auth/verify-email` | Verify email with code (frontend must send BOTH) | `{ email, code }` |
| POST `/api/auth/resend-verification` | Resend verification email (requires email body) | `{ email }` |
| POST `/api/auth/login` | Login user | `{ email, password }` |
| GET `/api/auth/me` | Get current user (auth) | – |

### KYC (Know Your Customer)
| Method & Path | Purpose | Body (JSON) |
|---------------|---------|-------------|
| POST `/api/kyc/start` | Start KYC process (auth) | `{ legalFirstName, legalLastName, dob, ssnLast4, addressLine1, addressLine2?, city, state, postalCode }` |
| GET `/api/kyc/status` | Get KYC status (auth) | – |
| POST `/api/webhooks/kyc` | KYC webhook callback (server to server) | `{ providerRef, decision, reason? }` |

### Envelopes (Budget Categories)
| Method & Path | Purpose | Body (JSON) |
|---------------|---------|-------------|
| GET `/api/envelopes` | List all envelopes with balances (auth) | – |
| GET `/api/envelopes/analytics` | Envelope spending analytics (auth) | – |
| GET `/api/envelopes/:id` | Get envelope by ID (auth) | – |
| POST `/api/envelopes` | Create envelope (auth) | `{ name, startingBalanceCents, icon?, color?, order? }` |
| PATCH `/api/envelopes/:id` | Update envelope (auth) | Partial above |
| DELETE `/api/envelopes/:id` | Delete envelope (auth) | – |

### Transactions
| Method & Path | Purpose | Query / Body |
|---------------|---------|--------------|
| GET `/api/transactions` | List transactions (auth) | `?month=YYYY-MM&envelopeId=&merchant=&page=&limit=` |
| GET `/api/transactions/:id` | Get transaction by ID (auth) | – |
| GET `/api/transactions/analytics/spending` | Spending analytics (auth) | – |
| GET `/api/transactions/pending` | Get pending tx for approval (auth) | – |
| POST `/api/transactions` | Create transaction (auth) | `{ ...transaction }` |
| PATCH `/api/transactions/:id/status` | Update transaction status (auth) | `{ status }` |
| POST `/api/transactions/import` | Import & auto-route (auth) | `{ file?, entries? }` |

### Transfers (Money Movement)
| Method & Path | Purpose | Body (JSON) |
|---------------|---------|-------------|
| GET `/api/transfers` | List transfers (auth) | – |
| POST `/api/transfers` | Move money between envelopes (auth) | `{ fromId?, toId?, amountCents, note? }` |

### Cards (Virtual Cards)
| Method & Path | Purpose | Body (JSON) |
|---------------|---------|-------------|
| GET `/api/cards` | Get all virtual cards (auth) | – |
| GET `/api/cards/analytics` | Card usage analytics (auth) | – |
| GET `/api/cards/:id` | Get card by ID (auth) | – |
| GET `/api/cards/:id/spending` | Card spending by envelope (auth) | – |
| POST `/api/cards` | Create virtual card (auth) | `{ name, envelopeId?, limitCents?, ... }` |
| PATCH `/api/cards/:id` | Update card (auth) | Partial card fields |
| POST `/api/cards/:id/wallet` | Add/remove from wallet (auth) | `{ inWallet: boolean }` |
| DELETE `/api/cards/:id` | Delete card (auth) | – |

### Routing Rules
| Method & Path | Purpose | Body (JSON) |
|---------------|---------|-------------|
| GET `/api/rules` | Get routing rules (auth) | – |
| GET `/api/rules/:id` | Get rule by ID (auth) | – |
| POST `/api/rules` | Create routing rule (auth) | `{ ...rule }` |
| PATCH `/api/rules/:id` | Update rule (auth) | Partial rule |
| DELETE `/api/rules/:id` | Delete rule (auth) | – |
| POST `/api/rules/reorder` | Reorder rules by priority (auth) | `{ order: string[] }` |

### Routing Configuration
| Method & Path | Purpose | Body (JSON) |
|---------------|---------|-------------|
| GET `/api/routing/config` | Get routing configuration (auth) | – |
| PATCH `/api/routing/config` | Update routing settings (auth) | `{ ...settings }` |
| POST `/api/routing/preview` | Preview routing decision (auth) | `{ transaction }` |
| POST `/api/routing/commit` | Commit transaction to envelope (auth) | `{ transactionId, envelopeId }` |

### AI Features (Requires OpenAI API key configured server-side)
| Method & Path | Purpose | Body (JSON) |
|---------------|---------|-------------|
| GET `/api/ai/health` | AI service health check | – |
| POST `/api/ai/test` | Test AI functionality | `{ prompt? }` |
| POST `/api/ai/coach` | Get AI budget coaching (auth) | `{ question, context? }` |
| POST `/api/ai/explain-routing` | Explain routing decisions (auth) | `{ transactionId }` |
| POST `/api/ai/setup-envelopes` | AI-powered envelope setup (auth) | `{ goals?, income?, prefs? }` |
| POST `/api/ai/execute-action` | Execute AI-suggested action (auth) | `{ action, payload? }` |
| GET `/api/ai/pending-approvals` | Get pending transaction approvals (auth) | – |
| POST `/api/ai/approve-transaction/:id` | Approve / reassign transaction (auth) | `{ envelopeId?, note? }` |

### Real-time Events
| Method & Path | Purpose |
|---------------|---------|
| GET `/api/events` | Server-Sent Events stream for real-time balance / status updates |

Client usage example:
```ts
const apiBase = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
const eventsUrl = import.meta.env.VITE_EVENTS_URL || `${apiBase}/events`;
const token = localStorage.getItem('auth_token');
// If backend expects Bearer token via query param (fallback when headers not supported for SSE):
const es = new EventSource(`${eventsUrl}?token=${encodeURIComponent(token ?? '')}`);

es.addEventListener('message', (e) => {
	// Generic message
	console.log('event', e.data);
});

es.addEventListener('balance.update', (e) => {
	const payload = JSON.parse(e.data);
	// Update app state with new envelope balance
});

es.onerror = (err) => {
	console.warn('SSE error – will retry automatically', err);
};
```

### Webhooks (External Integration)
| Method & Path | Purpose | Body (JSON) |
|---------------|---------|-------------|
| POST `/api/webhooks/transactions` | Transaction webhook handler | `{ provider, events[] }` |
| POST `/api/webhooks/kyc` | KYC status webhook handler | `{ providerRef, decision, reason? }` |
| GET `/api/webhooks/health` | Webhook health check | – |

### System
| Method & Path | Purpose |
|---------------|---------|
| GET `/healthz` | System health check |

### Runtime API Base Overrides (Dev Only)
Ephemeral backend URLs (e.g. Replit) can change between restarts. In development you can switch the active API base at runtime without rebuilding:

1. Query param: append `?api=<base-url>` (or legacy `?apiBase=`). Example: `http://localhost:5173/?api=https://my-backend.replit.dev/api`.
2. Dev console helper: `window.__setApiBase('https://my-backend.replit.dev/api')`.
3. Floating switcher: The `DevApiSwitcher` panel (top-right) lets you test + persist a new base after a health check.

Precedence order (highest first): runtime override (query param or persisted override) > `VITE_API_URL` > legacy `VITE_API_BASE_URL` > dev fallback `http://localhost:5000/api` > production fallback.

When verifying or resending email codes ensure the frontend payload includes the `email` field. The `verifyEmail` service has been updated to send `{ email, code }` and `resendVerification` sends `{ email }`.

### Authentication Flow – Example (TypeScript)
```ts
// Register user
const registerResponse = await fetch(`${API_BASE_URL}/auth/register`, {
	method: 'POST',
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify({ name, email, password })
});

// Verify email
const verifyResponse = await fetch(`${API_BASE_URL}/auth/verify-email`, {
	method: 'POST',
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify({ email, code })
});

// Login
const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
	method: 'POST',
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify({ email, password })
});

// Store token and use in subsequent requests
const { token } = await loginResponse.json();
localStorage.setItem('auth_token', token); // repository uses 'auth_token'
// (If following example naming from backend docs you may also see 'authToken')

// Authenticated request
const stored = localStorage.getItem('auth_token');
const envelopes = await fetch(`${API_BASE_URL}/envelopes`, {
	headers: {
		'Authorization': `Bearer ${stored}`,
		'Content-Type': 'application/json'
	}
});
```

### Notes
* All endpoints prefixed with `/api` under `VITE_API_URL` (preferred) or legacy `VITE_API_BASE_URL`.
* SSE endpoint (`/api/events`) should be opened with `EventSource` (no auth header if token in cookie; else append `?token=` or use fetch polyfill strategy if required by backend implementation).
* Webhook endpoints are for server → server callbacks; do not call from browser.
* KYC workflow (detailed):
	1. Register (`POST /auth/register`)
	2. Verify email (`POST /auth/verify-email`)
	3. Start KYC (`POST /kyc/start`)
	4. Poll status (`GET /kyc/status`) every N seconds until `approved` (or receive webhook → UI refresh)
	5. Unlock full app features (envelopes, transactions, AI coaching)

### Sample Responses
Representative (approximate) schema excerpts; fields may evolve—treat unspecified props as optional.

#### Login (`POST /auth/login`)
```json
{
	"token": "<jwt>",
	"user": {
		"id": "usr_123",
		"name": "Jane Doe",
		"email": "jane@example.com",
		"kycStatus": "pending", // one of: unstarted | pending | approved | rejected
		"createdAt": "2025-08-13T10:21:33.000Z"
	}
}
```

#### KYC Status (`GET /kyc/status`)
```json
{ "status": "pending", "lastUpdated": "2025-08-13T10:25:11.000Z" }
```
Approved example:
```json
{ "status": "approved", "approvedAt": "2025-08-13T10:29:44.000Z" }
```
Rejected example:
```json
{ "status": "rejected", "reason": "Document mismatch" }
```

#### Envelopes List (`GET /envelopes`)
```json
[
	{
		"id": "env_groceries",
		"name": "Groceries",
		"balanceCents": 452300,
		"color": "teal",
		"icon": "shopping-cart",
		"updatedAt": "2025-08-12T17:05:00.000Z"
	},
	{
		"id": "env_rent",
		"name": "Rent",
		"balanceCents": 0,
		"color": "indigo",
		"icon": "home"
	}
]
```

#### Transaction (`GET /transactions/:id`)
```json
{
	"id": "tx_789",
	"amountCents": -1299,
	"merchant": "Coffee Shop",
	"envelopeId": "env_groceries",
	"status": "cleared", // pending | cleared | flagged
	"createdAt": "2025-08-11T08:12:00.000Z"
}
```

#### AI Coach (`POST /ai/coach`)
```json
{
	"answer": "You can reallocate $50 from Dining Out to Savings to stay on track.",
	"sources": ["envelopes:env_dining", "envelopes:env_savings"],
	"suggestedActions": [
		{"action": "transfer", "from": "env_dining", "to": "env_savings", "amountCents": 5000}
	]
}
```

#### Events Stream (`GET /events` – sample messages)
```jsonc
// event: balance.update
{"type": "balance.update", "envelopeId": "env_groceries", "balanceCents": 450000}

// event: kyc.status
{"type": "kyc.status", "status": "approved"}
```

## Environment & API Diagnostics
Use these steps to ensure environment variables and headers are applied before manual QA.
### 1. Validate .env
Run (prefer new var, fall back to legacy):
```bash
grep VITE_API_URL .env || grep VITE_API_BASE_URL .env || echo "Missing VITE_API_URL (or legacy VITE_API_BASE_URL)"
```
Ensure one of them matches the backend (e.g. `https://envelopes-backend.ashb786.repl.co/api`).

### 2. Inspect Built-Time Vars
In browser devtools console:
```js
import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL
import.meta.env.VITE_EVENTS_URL
```
They should output the configured strings (or `undefined` for unset optional ones). Remember: if both base vars are set, `VITE_API_URL` wins.

### 3. Confirm Request Headers
Network tab → first POST /api/auth/login:
Headers should include:
```
Content-Type: application/json
Authorization: Bearer <token>        (after initial login)
x-replit-user-id: <value>            (dev only if set)
x-replit-user-name: <value>          (dev only if set)
```

### 4. Verify Token Persistence
Open Application > Local Storage:
Key `auth_token` should appear after successful login.

### 5. SSE Stream Test
In console:
```js
const apiBase = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
new EventSource((import.meta.env.VITE_EVENTS_URL||apiBase+"/events")+"?token="+localStorage.getItem('auth_token'))
```
Expect readyState 0→1; observe messages if backend emits.

### 6. Common Misconfigs
| Issue | Fix |
|-------|-----|
| Missing preceding https:// in base URL | Add protocol. |
| Trailing slash double // in requests | Base is sanitized in api.ts (trailing slash removed). |
| Invalid token after redeploy | Clear `localStorage.auth_token` and login again. |
| CORS failure | Confirm backend allows origin; adjust server or run via proxy. |

### 7. Programmatic Environment Checks (Optional)
Add a lightweight runtime assertion at app bootstrap if desired:
```ts
// main.tsx
if(!(import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL)) {
	console.warn('API base URL missing – set VITE_API_URL');
}
```

