export type DiscoveredRoute = {
	path: string;
	label: string;
	sublabel?: string;
};

// /dev/* pages are dev-only tools (some reachable via nav, some only by
// direct URL) - discoverable in the command palette in dev, but never meant
// to surface at all in prod.
const EXCLUDED_PREFIXES = import.meta.env.DEV ? [] : [`/dev`];

function isDynamicSegment(segment: string): boolean {
	return segment.startsWith(`[`) && segment.endsWith(`]`);
}

function toLabel(segment: string): string {
	return segment
		.split(`-`)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(` `);
}

function toPath(modulePath: string): string {
	return modulePath.replace(/^\/src\/routes/, ``).replace(/\/\+page\.svelte$/, ``) || `/`;
}

// Every static page under src/routes, so pages that aren't in the header nav
// (e.g. reference/house, only ever reached by following a link within
// /reference) still turn up in the command palette. Dynamic segments
// (recipes/[slug], sign-in/[...rest]) are skipped - those need real data to
// resolve to a page and are searched separately where that data is already
// being fetched (recipes, content entries).
export function getDiscoverableRoutes(
	modules: Record<string, unknown> = import.meta.glob(`/src/routes/**/+page.svelte`)
): DiscoveredRoute[] {
	return Object.keys(modules)
		.map(toPath)
		.filter((path) => !path.split(`/`).some(isDynamicSegment))
		.filter((path) => !EXCLUDED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`)))
		.map((path) => {
			const segments = path.split(`/`).filter(Boolean);
			return {
				path,
				label: segments.length ? toLabel(segments[segments.length - 1]) : `Home`,
				sublabel: segments.length > 1 ? toLabel(segments[segments.length - 2]) : undefined,
			};
		});
}
