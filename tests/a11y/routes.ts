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

export const routes: A11yRoute[] = [
	{ name: `sign-in`, path: `/sign-in`, auth: false },
	{ name: `home`, path: `/`, auth: true },
	{ name: `tasks`, path: `/tasks`, auth: true },
	{ name: `habits`, path: `/habits`, auth: true },
	{ name: `chores`, path: `/chores`, auth: true },
	// The @event-calendar/core-specific aria-required-children suppression
	// this used to carry is gone along with that library (see CLAUDE.md's
	// Calendar section) - @svar-ui/svelte-calendar's toolbar/layout markup
	// doesn't nest a <nav> inside a role="table"/"list" container the way
	// @event-calendar/core did. Re-add a suppression here (with a comment
	// explaining the new violation) if CI turns up a different SVAR-specific
	// a11y issue once this actually runs against a live preview.
	{ name: `calendar`, path: `/calendar`, auth: true },
	{ name: `schedule`, path: `/schedule`, auth: true },
	{ name: `budget`, path: `/budget`, auth: true },
	{ name: `recipes`, path: `/recipes`, auth: false },
	{ name: `recipe-tags`, path: `/recipes/tags`, auth: false },
	{ name: `meal-plan`, path: `/meal-plan`, auth: true },
	{ name: `shopping-list`, path: `/shopping-list`, auth: true },
	{ name: `shopping-list-cart`, path: `/shopping-list/cart`, auth: true },
	{ name: `reference`, path: `/reference`, auth: true },
	{ name: `reference-house`, path: `/reference/house`, auth: true },
	{ name: `reference-books`, path: `/reference/books`, auth: true },
	{ name: `reference-books-authors`, path: `/reference/books/authors`, auth: true },
	{ name: `reference-books-series`, path: `/reference/books/series`, auth: true },
	{ name: `small-human`, path: `/small-human`, auth: true },
	{ name: `health`, path: `/health`, auth: true },
	{ name: `dashboard`, path: `/dashboard`, auth: true },
	{ name: `content`, path: `/content`, auth: true },
	{ name: `search`, path: `/search`, auth: true },
	{ name: `content-archive`, path: `/content/archive`, auth: true },
	{ name: `content-save`, path: `/content/save`, auth: true },
	{ name: `profile`, path: `/profile`, auth: true },
	{ name: `design-colours`, path: `/design/colours`, auth: true },
];
