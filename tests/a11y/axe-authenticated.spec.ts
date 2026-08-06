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
	const firstEntry = page.getByRole(`main`).getByRole(`listitem`).locator(`a`).first();
	await firstEntry.waitFor();
	await firstEntry.click();
	await runAxeScan(page, `content-entry`);
});

test(`content sub-page (via /content, first course-style entry) has no automatically detectable accessibility violations`, async ({
	page,
}) => {
	await page.goto(`/content`);
	const entryCount = await page.getByRole(`main`).getByRole(`listitem`).locator(`a`).count();

	for (let i = 0; i < entryCount; i++) {
		await page.goto(`/content`);
		await page.getByRole(`main`).getByRole(`listitem`).locator(`a`).nth(i).click();

		const pageLink = page.locator(`.list a`).first();
		if (await pageLink.count()) {
			await pageLink.click();
			await runAxeScan(page, `content-subpage`);
			return;
		}
	}

	test.skip(true, `No course-style content entry with sub-pages was found to test.`);
});

test(`book author detail (via /reference/books/authors) has no automatically detectable accessibility violations`, async ({ page }) => {
	await page.goto(`/reference/books/authors`);
	const firstAuthor = page.locator(`a.author-card`).first();
	await firstAuthor.waitFor();
	await firstAuthor.click();
	await runAxeScan(page, `book-author-detail`);
});

test(`book series detail (via /reference/books/series) has no automatically detectable accessibility violations`, async ({ page }) => {
	await page.goto(`/reference/books/series`);
	const firstSeries = page.locator(`a.series-card`).first();
	await firstSeries.waitFor();
	await firstSeries.click();
	await runAxeScan(page, `book-series-detail`);
});

// Archived content only exists for digest-style entries that have at least
// one version marked Archived (see findEntry.ts) - not guaranteed to exist,
// so this skips rather than fails when the live content database has none.
test(`content archive entry (via /content/archive) has no automatically detectable accessibility violations`, async ({ page }) => {
	await page.goto(`/content/archive`);
	const firstEntry = page.getByRole(`main`).getByRole(`listitem`).locator(`a`).first();

	if (!(await firstEntry.count())) {
		test.skip(true, `No archived content entry was found to test.`);
		return;
	}

	await firstEntry.click();
	await runAxeScan(page, `content-archive-entry`);
});
