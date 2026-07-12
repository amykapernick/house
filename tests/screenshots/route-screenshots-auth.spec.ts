import { test } from '@playwright/test';
import { routes } from '../a11y/routes';
import { captureRouteAtAllWidths } from './route-screenshot-helpers';

for (const route of routes.filter((r) => r.auth)) {
	test(`screenshot ${route.name} (${route.path})`, async ({ page }) => {
		await page.goto(route.path);
		// Home renders the signed-in dashboard here vs the signed-out landing
		// view captured by route-screenshots-pub.spec.ts - distinguish the files.
		await captureRouteAtAllWidths(page, route.name === `home` ? `home-signed-in` : route.name);
	});
}

// Dynamic detail pages aren't in routes.ts because they need a real, live
// item to navigate to rather than a fixed path - reached by clicking through
// from their index page, mirroring tests/a11y/axe-authenticated.spec.ts.
test(`screenshot content entry (via /content)`, async ({ page }) => {
	await page.goto(`/content`);
	const firstEntry = page.locator(`a.card`).first();
	await firstEntry.waitFor();
	await firstEntry.click();
	await captureRouteAtAllWidths(page, `content-entry`);
});

test(`screenshot content sub-page (via /content, first course-style entry)`, async ({ page }) => {
	await page.goto(`/content`);
	const entryCount = await page.locator(`a.card`).count();

	for (let i = 0; i < entryCount; i++) {
		await page.goto(`/content`);
		await page.locator(`a.card`).nth(i).click();

		const pageLink = page.locator(`.list a`).first();
		if (await pageLink.count()) {
			await pageLink.click();
			await captureRouteAtAllWidths(page, `content-subpage`);
			return;
		}
	}

	test.skip(true, `No course-style content entry with sub-pages was found to screenshot.`);
});
