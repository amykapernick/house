/**
 * Pages scanned by both the playwright-axe spec and the pa11y runner.
 * Kept in one place so the two tools cover the same surface area.
 * Mirrors the authenticated routes in src/lib/navigation.ts, plus sign-in.
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
	{ name: `calendar`, path: `/calendar`, auth: true },
	{ name: `schedule`, path: `/schedule`, auth: true },
	{ name: `budget`, path: `/budget`, auth: true },
	{ name: `recipes`, path: `/recipes`, auth: false },
	{ name: `meal-plan`, path: `/meal-plan`, auth: true },
	{ name: `shopping-list`, path: `/shopping-list`, auth: true },
	{ name: `reference`, path: `/reference`, auth: true },
	{ name: `small-human`, path: `/small-human`, auth: true },
	{ name: `profile`, path: `/profile`, auth: true },
];
