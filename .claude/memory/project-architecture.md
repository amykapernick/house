---
name: project-architecture
description: "House management app architecture — SvelteKit frontend + Azure Functions GraphQL API, how they connect, auth flow"
metadata: 
  node_type: memory
  type: project
  originSessionId: 2406f905-ea6a-4f31-8fb8-12901deb6175
---

Two repos in this workspace:
- `/home/amy/dev/household` — SvelteKit 5 frontend (Svelte 5 runes, Vite 8)
- `/home/amy/dev/household_api` — Azure Functions v4 GraphQL API (Apollo Server, TypeScript compiled to CommonJS)

**Data flow:** SvelteKit pages fetch data client-side after Clerk JS authenticates. Requests go through a SvelteKit proxy at `/api/graphql/+server.ts` which forwards to `localhost:7071/graphql` (the API). This avoids CORS issues in Codespaces.

**Why:** Clerk session JWTs expire after ~60 seconds. Server-side data fetching with stale cookies didn't work. Client-side fetching with fresh tokens from `clerk.session.getToken()` is reliable.

**How to apply:** Always fetch authenticated data client-side via `fetchClientData` with a `cacheKey`. Don't try server-side auth with Clerk cookies.
