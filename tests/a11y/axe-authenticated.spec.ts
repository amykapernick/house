import { test } from '@playwright/test';
import { routes } from './routes';
import { runAxeScan } from './axe-helpers';

for (const route of routes.filter((r) => r.auth)) {
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
test(`content entry (via /content) has no automatically detectable accessibility violations`, async ({ page }) => {
	await page.goto(`/content`);
	const firstEntry = page.locator(`a.card`).first();
	await firstEntry.waitFor();
	await firstEntry.click();
	await runAxeScan(page, `content-entry`);
});

test(`content sub-page (via /content, first course-style entry) has no automatically detectable accessibility violations`, async ({
	page,
}) => {
	await page.goto(`/content`);
	const entryCount = await page.locator(`a.card`).count();

	for (let i = 0; i < entryCount; i++) {
		await page.goto(`/content`);
		await page.locator(`a.card`).nth(i).click();

		const pageLink = page.locator(`.list a`).first();
		if (await pageLink.count()) {
			await pageLink.click();
			await runAxeScan(page, `content-subpage`);
			return;
		}
	}

	test.skip(true, `No course-style content entry with sub-pages was found to test.`);
});
