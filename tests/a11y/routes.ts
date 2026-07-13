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
	// axe-only: rules to skip on this route because the violation is baked
	// into a third-party dependency's own markup, not our code. Not read by
	// the pa11y runner (different engine/ruleset, and it doesn't flag these).
	axeDisableRules?: string[];
}

// @event-calendar/core (5.7.1, and still true in the latest 5.9.0 per its
// published source) always renders its toolbar <nav> as a direct child of
// the calendar's own role="table"/"list" container - ARIA disallows that
// nesting, but it's the library's own structure, not something we can fix
// from consumer code without patching its DOM after every render.
const CALENDAR_LIBRARY_RULES = [`aria-required-children`];

export const routes: A11yRoute[] = [
	{ name: `sign-in`, path: `/sign-in`, auth: false },
	{ name: `home`, path: `/`, auth: true },
	{ name: `tasks`, path: `/tasks`, auth: true },
	{ name: `habits`, path: `/habits`, auth: true },
	{ name: `calendar`, path: `/calendar`, auth: true, axeDisableRules: CALENDAR_LIBRARY_RULES },
	{ name: `schedule`, path: `/schedule`, auth: true, axeDisableRules: CALENDAR_LIBRARY_RULES },
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
