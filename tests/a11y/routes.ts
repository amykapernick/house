/**
 * Pages scanned by both the playwright-axe spec and the pa11y runner.
 * Kept in one place so the two tools cover the same surface area.
 * Mirrors the authenticated routes in src/lib/navigation.ts, plus sign-in.
 *
 * IMPORTANT: any new route added to the app (menuItems, authOnlyRoutes, or a
 * standalone static page) must be added here too, or it silently gets no
 * a11y coverage. Dynamic detail routes (e.g. /recipes/[slug]) can't be listed
 * here since they need a real item to load rather than a fixed path - those
 * are covered instead by dedicated click-through tests in
 * axe-public.spec.ts/axe-authenticated.spec.ts (and are NOT scanned by the
 * pa11y runner, which only visits the static paths below).
 */
export interface A11yRoute {
	name: string;
	path: string;
	auth: boolean;
}

export const routes: A11yRoute[] = [
	{ name: `sign-in`, path: `/sign-in`, auth: false },
	{ name: `home`, path: `/`, auth: true },
	{ name: `tasks`, path: `/tasks`, auth: true },
	{ name: `habits`, path: `/habits`, auth: true },
	{ name: `calendar`, path: `/calendar`, auth: true },
	{ name: `schedule`, path: `/schedule`, auth: true },
	{ name: `budget`, path: `/budget`, auth: true },
	{ name: `recipes`, path: `/recipes`, auth: false },
	{ name: `recipe-tags`, path: `/recipes/tags`, auth: false },
	{ name: `meal-plan`, path: `/meal-plan`, auth: true },
	{ name: `shopping-list`, path: `/shopping-list`, auth: true },
	{ name: `reference`, path: `/reference`, auth: true },
	{ name: `reference-house`, path: `/reference/house`, auth: true },
	{ name: `small-human`, path: `/small-human`, auth: true },
	{ name: `health`, path: `/health`, auth: true },
	{ name: `content`, path: `/content`, auth: true },
	{ name: `profile`, path: `/profile`, auth: true },
];
