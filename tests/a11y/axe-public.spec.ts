import { test } from '@playwright/test';
import { routes } from './routes';
import { runAxeScan } from './axe-helpers';

for (const route of routes.filter((r) => !r.auth)) {
	test(`${route.name} (${route.path}) has no automatically detectable accessibility violations`, async ({
		page,
	}) => {
		await page.goto(route.path);
		await runAxeScan(page, route.name, route.axeDisableRules);
	});
}

// Dynamic detail pages aren't in routes.ts because they need a real, live
// item to navigate to rather than a fixed path - reached by clicking through
// from their index page instead of a hardcoded URL.
test(`recipe detail (via /recipes) has no automatically detectable accessibility violations`, async ({ page }) => {
	await page.goto(`/recipes`);
	// Scoped to main - an unscoped `a[href^="/recipes/"]` locator also matches
	// the (hidden) global command palette's recently-visited-pages results,
	// which can include a /recipes/tags entry from earlier in the test run
	// and resolves first in DOM order, never becoming visible.
	const firstRecipe = page.getByRole(`main`).locator(`a[href^="/recipes/"]`).first();
	await firstRecipe.waitFor();
	await firstRecipe.click();
	await runAxeScan(page, `recipe-detail`);
});

test(`recipe tag detail (via /recipes/tags) has no automatically detectable accessibility violations`, async ({ page }) => {
	await page.goto(`/recipes/tags`);
	const firstTag = page.locator(`a.tag-card`).first();
	await firstTag.waitFor();
	await firstTag.click();
	await runAxeScan(page, `recipe-tag-detail`);
});
