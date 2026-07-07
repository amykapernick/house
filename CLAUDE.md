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

## GraphQL Type Generation

`codegen.ts` (`graphql-codegen`, run via `npm run generate`) reads schema from the sibling `../household_api/src/graphql/**/*.graphql` and writes `src/lib/types/generated.ts`, which is committed to git.

- **Local dev:** `predev` npm script runs `generate` automatically before every `npm run dev`, using the sibling checkout.
- **CI:** `household_api`'s deploy workflow dispatches a `schema-updated` `repository_dispatch` event to this repo whenever its `.graphql` files change on `prod`. `.github/workflows/schema-updated.yml` receives it, writes the schema into `../household_api/src/graphql/...`, runs `npm run generate`, and pushes the regenerated `generated.ts` straight to `prod` — which in turn triggers the normal build-and-deploy workflow. No secret lives in this (public) repo for this; the dispatch token is held by `household_api`.

## Not Yet Migrated

- Recipes, meal planning, shopping list — will integrate with Mealie API
- SVG icon components for house map
