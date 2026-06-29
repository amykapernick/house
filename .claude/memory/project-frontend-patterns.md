---
name: project-frontend-patterns
description: "SvelteKit frontend patterns — client-side data fetching with caching, auth setup, page structure"
metadata: 
  node_type: memory
  type: project
  originSessionId: 2406f905-ea6a-4f31-8fb8-12901deb6175
---

**Data fetching:** All authenticated data is fetched client-side using `$lib/utils/fetchClientData.ts`. Pass a `cacheKey` to cache results in localStorage for 30 minutes. Cache is shared across pages — e.g. tasks loaded on `/tasks` are available on `/calendar` without re-fetching.

**Auth:** Clerk JS SDK initialized in `+layout.svelte` on mount. Auth state via Svelte stores in `$lib/auth.ts` — `isAuthenticated`, `clerk`, `user`, `getToken()`. Pages use `$effect` to fetch data when `$isAuthenticated` becomes true. The `addListener` on Clerk updates the store reactively when session changes.

**Page pattern:**
```svelte
$effect(() => {
    if ($isAuthenticated) {
        fetchClientData({ cacheKey: 'key', gqlQuery: `...` })
            .then((res) => { data = res.thing ?? []; loading = false; });
    }
});
```

**Calendar:** Uses `@event-calendar/core` with DayGrid, TimeGrid, List, Interaction plugins. Events from three sources: tasks (via `parseTasks`), Notion events (via `parseEvents`), and ICS calendar feeds (via `parseEvents` — same format). ICS events fetched separately so they don't block the main query.

**PWA:** Service worker in `src/service-worker.ts`, manifest in `static/manifest.json`. Caches app shell + static assets. API calls excluded from service worker — localStorage caching handles offline data.

**Skipped for now:** Recipes, meal planning, shopping list — will integrate with Mealie API later.
