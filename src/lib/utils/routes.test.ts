import { describe, it, expect } from 'vitest';
import { getDiscoverableRoutes } from './routes';

function modules(paths: string[]): Record<string, unknown> {
	return Object.fromEntries(paths.map((path) => [path, () => {}]));
}

describe(`getDiscoverableRoutes`, () => {
	it(`turns a route file path into a path, label and parent sublabel`, () => {
		const routes = getDiscoverableRoutes(modules([`/src/routes/reference/house/+page.svelte`]));

		expect(routes).toEqual([{ path: `/reference/house`, label: `House`, sublabel: `Reference` }]);
	});

	it(`labels the root route Home with no sublabel`, () => {
		const routes = getDiscoverableRoutes(modules([`/src/routes/+page.svelte`]));

		expect(routes).toEqual([{ path: `/`, label: `Home`, sublabel: undefined }]);
	});

	it(`title-cases hyphenated segments`, () => {
		const routes = getDiscoverableRoutes(modules([`/src/routes/shopping-list/+page.svelte`]));

		expect(routes[0]).toMatchObject({ path: `/shopping-list`, label: `Shopping List` });
	});

	it(`skips routes with a dynamic segment`, () => {
		const routes = getDiscoverableRoutes(modules([
			`/src/routes/recipes/[slug]/+page.svelte`,
			`/src/routes/sign-in/[...rest]/+page.svelte`,
			`/src/routes/recipes/tags/+page.svelte`,
		]));

		expect(routes.map((route) => route.path)).toEqual([`/recipes/tags`]);
	});

	it(`excludes dev-only tooling routes`, () => {
		const routes = getDiscoverableRoutes(modules([`/src/routes/dev/graphql/+page.svelte`]));

		expect(routes).toEqual([]);
	});
});
