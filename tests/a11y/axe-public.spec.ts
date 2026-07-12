import { test } from '@playwright/test';
import { routes } from './routes';
import { runAxeScan } from './axe-helpers';

for (const route of routes.filter((r) => !r.auth)) {
	test(`${route.name} (${route.path}) has no automatically detectable accessibility violations`, async ({
		page,
	}) => {
		await page.goto(route.path);
		await runAxeScan(page, route.name);
	});
}

// Dynamic detail pages aren't in routes.ts because they need a real, live
// item to navigate to rather than a fixed path - reached by clicking through
// from their index page instead of a hardcoded URL.
test(`recipe detail (via /recipes) has no automatically detectable accessibility violations`, async ({ page }) => {
	await page.goto(`/recipes`);
	const firstRecipe = page.locator(`a.card`).first();
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
