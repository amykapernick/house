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

`.github/workflows/azure-static-web-apps-black-pebble-05ac82803.yml` runs on push/PR to `prod`: lints, files GitHub issues for TODO comments via `ribtoks/tdg-github-action` (excludes `node_modules|dist|build|.svelte-kit`), then builds and deploys to Azure Static Web Apps. Note: GitHub Actions runs the workflow YAML as it existed at the *triggering* commit, not the latest on the branch — a workflow fix only takes effect for pushes made after it lands.

On PRs (not pushes to `prod`), the `Build And Deploy` step also creates an Azure SWA *preview* environment with its own URL (`steps.builddeploy.outputs.static_web_app_url`). The `accessibility_tests` job runs against that live preview — before merge to `prod` — using Playwright + `@axe-core/playwright` (axe engine) and `pa11y` (HTML_CodeSniffer engine, reusing the Clerk session cookies from Playwright's auth setup rather than logging in twice). A11y failures block the PR. See `tests/a11y/` and `scripts/run-pa11y.mjs`; the route list lives in `tests/a11y/routes.ts` — add new pages there. Requires these repo secrets (not yet configured as of 2026-07-09): `CLERK_SECRET_KEY`, `CLERK_TEST_USER_EMAIL`, `CLERK_TEST_USER_PASSWORD` (a dedicated Clerk test user for signing in during CI).

## GraphQL Type Generation

`codegen.ts` (`graphql-codegen`, run via `npm run generate`) reads schema from the sibling `../household_api/src/graphql/**/*.graphql` and writes `src/lib/types/generated.ts`, which is committed to git.

- **Local dev:** `predev` npm script runs `generate` automatically before every `npm run dev`, using the sibling checkout.
- **CI:** `household_api`'s deploy workflow dispatches a `schema-updated` `repository_dispatch` event to this repo whenever its `.graphql` files change on `prod`. `.github/workflows/schema-updated.yml` receives it, writes the schema into `../household_api/src/graphql/...`, runs `npm run generate`, and pushes the regenerated `generated.ts` straight to `prod` — which in turn triggers the normal build-and-deploy workflow. No secret lives in this (public) repo for this; the dispatch token is held by `household_api`.

## Auslan Sign Gifs

`src/lib/components/parts/smallHuman/Auslan.svelte` prefers a locally-hosted `static/signs/{signId}.gif` over the live Signbank video (`reference.video`) when opening a sign's modal, falling back to the video via an `<img onerror>` check if no gif exists yet for that sign — no manifest or build step needed on this side.

- **Manual/backfill:** `household_api`'s `npm run generate:sign-gifs` script pulls signs straight from PocketBase and writes gifs into this repo's `static/signs/` via the sibling checkout (skips signs that already have one).
- **Automatic:** `household_api`'s scheduled small-human tracker function dispatches an `auslan-signs-updated` `repository_dispatch` event (with `{id, video}` for every sign) after each update. `.github/workflows/auslan-signs-updated.yml` receives it, runs `scripts/generateSignGifsFromPayload.mjs` (ffmpeg, skips signs with an existing gif) and pushes any new gifs straight to `prod` — which triggers the normal build-and-deploy workflow. No secret lives in this (public) repo for this; the dispatch token is held by `household_api`.

## Not Yet Migrated

- Recipes, meal planning, shopping list — will integrate with Mealie API
- SVG icon components for house map
