// Stand-in for SvelteKit's $app/paths in vitest, which (deliberately, see
// vitest.config.ts) doesn't load the SvelteKit vite plugin that provides the
// real virtual module. Only `resolve` is mocked - add others here as needed.
export function resolve(path: string, params?: Record<string, string>): string {
	if (!params) return path;
	return path.replace(/\[(?:\.\.\.)?(\w+)\]/g, (_, key) => params[key] ?? ``);
}
