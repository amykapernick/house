---
name: project-api-patterns
description: "API conventions — how GraphQL resolvers, Notion fetching, and data parsers are structured"
metadata: 
  node_type: memory
  type: project
  originSessionId: 2406f905-ea6a-4f31-8fb8-12901deb6175
---

**GraphQL resolver pattern:**
1. `src/graphql/{name}/resolvers.ts` — calls a fetch utility with `context.baseUrl` and `context.token`
2. `src/utils/{name}/fetch.ts` — POSTs to `${baseUrl}/notion` (or `/todoist`) with the source name
3. The `/notion` Azure Function looks up the source config, checks auth, then calls `fetchDatabase` which queries Notion and passes results through a parser
4. Parsers live in `src/utils/notion/parse/{name}.ts`

**Special sources:** Some sources (like `small-human`) use page IDs instead of database IDs. These are handled via `fetchPageJson` which walks child pages to find JSON code blocks. Configured in `pageJsonSources` map in `notion.ts`.

**Notion property names may drift** from what parsers expect. Always use optional chaining (`?.`) on Notion property access. The tasks parser needs to check both `Name` and `Task name`, `Assignee` and `Assigned`.

**Todoist SDK v7** returns paginated results `{ results, nextCursor }` — unwrap with `res?.results ?? res`. Task fields: `content` (name), `checked` (done), `responsibleUid` (assignee), no `url` field (construct from ID).

**How to apply:** New data sources should follow the resolver → fetch → notion endpoint → parser pattern. Use `module.exports` in files that are `require()`d by resolvers, `export default` in files that are `import`ed by functions.
