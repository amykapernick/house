# House Management App

SvelteKit 5 frontend (Svelte 5 runes, Vite 8) for household management — tasks, calendar, reference pages, and baby tracker.

## Architecture

- **Frontend:** SvelteKit with client-side data fetching after Clerk JS auth
- **API:** Separate repo (`kaperscrewe_api`) — Azure Functions v4 GraphQL API on `localhost:7071`
- **Proxy:** `/api/graphql/+server.ts` proxies client requests to the API (avoids CORS in Codespaces)
- **Auth:** Clerk JS SDK — initialised in `+layout.svelte`, stores in `$lib/auth.ts`. Clerk session JWTs expire after ~60 seconds so all authenticated data is fetched client-side with fresh tokens, not server-side
- **Caching:** `fetchClientData` caches responses in localStorage for 30 minutes via `cacheKey`. Cache is shared across pages

## Key Paths

- `src/routes/` — SvelteKit pages
- `src/lib/components/` — Svelte components (layouts, partials, parts)
- `src/lib/utils/fetchClientData.ts` — client-side GraphQL fetch with localStorage caching
- `src/lib/auth.ts` — Clerk auth stores and init
- `src/lib/styles/` — PostCSS styles (mixins, global, config with colour/font variables)
- `src/routes/api/graphql/+server.ts` — proxy to API
- `static/` — fonts, icons, manifest

## Conventions

- **No component libraries, no Tailwind** — all CSS is custom, written in scoped `<style>` blocks using the PostCSS pipeline
- PostCSS plugins: postcss-advanced-variables, postcss-nesting, postcss-mixins, postcss-hexrgba
- Colour variables defined in `src/lib/styles/config/colours.js`, used as CSS custom properties (`var(--purple_bright)`)
- Mixins imported with `@import '@mixins'` in component styles

## Page Data Pattern

```svelte
$effect(() => {
    if ($isAuthenticated) {
        fetchClientData({ cacheKey: 'key', gqlQuery: `...` })
            .then((res) => { data = res.thing ?? []; loading = false; });
    }
});
```

## Calendar

Uses `@event-calendar/core` with DayGrid, TimeGrid, List, Interaction plugins. Three event sources parsed to a common format: tasks (`parseTasks`), Notion events (`parseEvents`), ICS feeds (`parseEvents`). ICS events fetched separately to avoid blocking.

## CI/CD

`.github/workflows/azure-static-web-apps-black-pebble-05ac82803.yml` runs on push/PR to `prod`: a fast `unit_tests` job (Vitest, no deploy dependency), lints, files GitHub issues for TODO comments via `ribtoks/tdg-github-action` (excludes `node_modules|dist|build|.svelte-kit`), then builds and deploys to Azure Static Web Apps. Note: GitHub Actions runs the workflow YAML as it existed at the *triggering* commit, not the latest on the branch — a workflow fix only takes effect for pushes made after it lands.

On PRs (not pushes to `prod`), the `Build And Deploy` step also creates an Azure SWA *preview* environment with its own URL (`steps.builddeploy.outputs.static_web_app_url`). The `accessibility_tests` job runs against that live preview — before merge to `prod` — using Playwright (`@axe-core/playwright` for accessibility, plus functional E2E specs) and `pa11y` (HTML_CodeSniffer engine, reusing the Clerk session cookies from Playwright's auth setup rather than logging in twice). Failures block the PR. Requires these repo secrets (configured 2026-07-09): `CLERK_SECRET_KEY`, `CLERK_TEST_USER_EMAIL`, `CLERK_TEST_USER_PASSWORD` (a dedicated Clerk test user for signing in during CI).

## Testing

- **Unit tests**: `vitest` (`npm run test:unit`), config in `vitest.config.ts` — deliberately standalone, not reusing `vite.config.ts`, because that file does a live fetch to the real API at load time to generate `colours.generated.css`, which would make every unit test run network-dependent. Tests are colocated `*.test.ts` files next to the source they cover (e.g. `src/lib/utils/monthlyAmount.test.ts`).
- **E2E / accessibility**: Playwright, `testDir: './tests'`, three projects distinguished by filename suffix regardless of subfolder — `setup/auth.setup.ts` (signs in via `@clerk/testing`, saves `tests/setup/.auth/state.json`), anything matching `*public.spec.ts`, anything matching `*authenticated.spec.ts` (depends on `setup`, reuses its `storageState`). `tests/a11y/` holds the axe scans (route list in `tests/a11y/routes.ts`, scanned by both `@axe-core/playwright` and the `pa11y` runner) and `tests/e2e/` holds functional flow specs. **Any new page — a new `menuItems`/`authOnlyRoutes` entry or standalone static route — must be added to `tests/a11y/routes.ts`, or it silently gets no a11y coverage.** Dynamic detail routes (e.g. `/recipes/[slug]`, `/content/[slug]`) can't go in that list since they need a real item to load rather than a fixed path; those get dedicated click-through tests instead (navigate to the index page, click the first item) in `axe-public.spec.ts`/`axe-authenticated.spec.ts` — and are only covered by axe, not pa11y, since the pa11y runner just visits static URLs.
- **E2E mutation safety**: this is a single-tenant personal app — one production API + PocketBase instance, no staging environment. Any E2E test that mutates data must create it with a distinctive marker (`[e2e-test]` prefix) and delete it in cleanup, never leave residue in real household data. Only `mealPlans`' `createMealPlanEntry`/`deleteMealPlanEntry` has a clean, isolated create+delete pair the UI directly supports — see `tests/e2e/meal-plan-authenticated.spec.ts`, which also has an `afterEach` safety net that deletes directly via GraphQL in case a mid-test assertion fails before the UI's own delete step runs. Everything else (budget, shopping list, tasks, schedule, small human) only gets read-only smoke coverage in `tests/e2e/smoke-*.spec.ts` — before adding a new mutating E2E test, check whether a clean delete/undo mutation actually exists first.

## GraphQL Type Generation

`codegen.ts` (`graphql-codegen`, run via `npm run generate`) reads schema from the sibling `../household_api/src/graphql/**/*.graphql` and writes `src/lib/types/generated.ts`, which is committed to git.

- **Local dev:** `predev` npm script runs `generate` automatically before every `npm run dev`, using the sibling checkout.
- **CI:** `household_api`'s deploy workflow dispatches a `schema-updated` `repository_dispatch` event to this repo whenever its `.graphql` files change on `prod`. `.github/workflows/schema-updated.yml` receives it, writes the schema into `../household_api/src/graphql/...`, runs `npm run generate`, and pushes the regenerated `generated.ts` straight to `prod` — which in turn triggers the normal build-and-deploy workflow. No secret lives in this (public) repo for this; the dispatch token is held by `household_api`.

## Auslan Sign Gifs

`src/lib/components/parts/smallHuman/Auslan.svelte` prefers a locally-hosted `static/signs/{signId}.gif` over the live Signbank video (`reference.video`) when opening a sign's modal, falling back to the video via an `<img onerror>` check if no gif exists yet for that sign — no manifest or build step needed on this side.

- **Manual/backfill:** `household_api`'s `npm run generate:sign-gifs` script pulls signs straight from PocketBase and writes gifs into this repo's `static/signs/` via the sibling checkout (skips signs that already have one).
- **Automatic:** `household_api`'s scheduled small-human tracker function dispatches an `auslan-signs-updated` `repository_dispatch` event (with `{id, video}` for every sign) after each update. `.github/workflows/auslan-signs-updated.yml` receives it, runs `scripts/generateSignGifsFromPayload.mjs` (ffmpeg, skips signs with an existing gif) and pushes any new gifs straight to `prod` — which triggers the normal build-and-deploy workflow. No secret lives in this (public) repo for this; the dispatch token is held by `household_api`.

## Not Yet Migrated

- SVG icon components for house map

Recipes, meal planning, and shopping list are backed by Mealie (via `household_api`'s `/mealie` proxy) — that migration is complete, not pending.
