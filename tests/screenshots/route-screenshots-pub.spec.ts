import { test } from '@playwright/test';
import { routes } from '../a11y/routes';
import { captureRouteAtAllWidths } from './route-screenshot-helpers';

for (const route of routes.filter((r) => !r.auth)) {
	test(`screenshot ${route.name} (${route.path})`, async ({ page }) => {
		await page.goto(route.path);
		await captureRouteAtAllWidths(page, route.name);
	});
}

// Home ("/") is marked auth: true in routes.ts (it's only scanned there for
// a11y purposes) but actually renders for signed-out visitors too, just with
// a "sign in" prompt instead of the dashboard widgets. This project has no
// storageState, so it captures that signed-out landing view - the
// authenticated project captures the signed-in dashboard as "home-signed-in".
test(`screenshot home (signed out)`, async ({ page }) => {
	await page.goto(`/`);
	await captureRouteAtAllWidths(page, `home-signed-out`);
});

// Dynamic detail pages aren't in routes.ts because they need a real, live
// item to navigate to rather than a fixed path - reached by clicking through
// from their index page, mirroring tests/a11y/axe-public.spec.ts.
test(`screenshot recipe detail (via /recipes)`, async ({ page }) => {
	await page.goto(`/recipes`);
	const firstRecipe = page.locator(`a[href^="/recipes/"]`).first();
	await firstRecipe.waitFor();
	await firstRecipe.click();
	await captureRouteAtAllWidths(page, `recipe-detail`);
});

test(`screenshot recipe tag detail (via /recipes/tags)`, async ({ page }) => {
	await page.goto(`/recipes/tags`);
	const firstTag = page.locator(`a.tag-card`).first();
	await firstTag.waitFor();
	await firstTag.click();
	await captureRouteAtAllWidths(page, `recipe-tag-detail`);
});

// /dev/* pages aren't in routes.ts (excluded from a11y coverage as internal
// dev-only tools) but they do render real component markup behind an
// `import.meta.env.DEV` check - meaningful to capture here since this tool
// always targets the vite dev server, never a preview/production build.
for (const devRoute of [`components`, `graphql`, `typography`]) {
	test(`screenshot dev/${devRoute}`, async ({ page }) => {
		await page.goto(`/dev/${devRoute}`);
		await captureRouteAtAllWidths(page, `dev-${devRoute}`);
	});
}
