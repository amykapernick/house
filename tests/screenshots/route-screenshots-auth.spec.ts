import { test } from '@playwright/test';
import { routes } from '../a11y/routes';
import { captureRouteAtAllWidths, waitForSignedIn } from './route-screenshot-helpers';

for (const route of routes.filter((r) => r.auth)) {
	test(`screenshot ${route.name} (${route.path})`, async ({ page }) => {
		await page.goto(route.path);
		await waitForSignedIn(page);
		// Home renders the signed-in dashboard here vs the signed-out landing
		// view captured by route-screenshots-pub.spec.ts - distinguish the files.
		await captureRouteAtAllWidths(page, route.name === `home` ? `home-signed-in` : route.name);
	});
}

// Dynamic detail pages aren't in routes.ts because they need a real, live
// item to navigate to rather than a fixed path - reached by clicking through
// from their index page, mirroring tests/a11y/axe-authenticated.spec.ts.
//
// ContentEntryCard.svelte renders one <li> (role listitem) per entry, each
// wrapping a single title link - scoped to <main> so Header/MainMenu's own
// <li> nav items (outside <main>) never match.
test(`screenshot content entry (via /content)`, async ({ page }) => {
	await page.goto(`/content`);
	await waitForSignedIn(page);
	const firstEntry = page.getByRole(`main`).getByRole(`listitem`).locator(`a`).first();
	await firstEntry.waitFor();
	await firstEntry.click();
	await captureRouteAtAllWidths(page, `content-entry`);
});

test(`screenshot content sub-page (via /content, first course-style entry)`, async ({ page }) => {
	await page.goto(`/content`);
	await waitForSignedIn(page);
	const entryCount = await page.getByRole(`main`).getByRole(`listitem`).locator(`a`).count();

	for (let i = 0; i < entryCount; i++) {
		await page.goto(`/content`);
		await waitForSignedIn(page);
		await page.getByRole(`main`).getByRole(`listitem`).locator(`a`).nth(i).click();

		const pageLink = page.locator(`.list a`).first();
		if (await pageLink.count()) {
			await pageLink.click();
			await captureRouteAtAllWidths(page, `content-subpage`);
			return;
		}
	}

	test.skip(true, `No course-style content entry with sub-pages was found to screenshot.`);
});

test(`screenshot content archive entry (via /content/archive)`, async ({ page }) => {
	await page.goto(`/content/archive`);
	await waitForSignedIn(page);
	const firstEntry = page.getByRole(`main`).getByRole(`listitem`).locator(`a`).first();
	await firstEntry.waitFor();
	await firstEntry.click();
	await captureRouteAtAllWidths(page, `content-archive-entry`);
});

test(`screenshot author detail (via /reference/books/authors)`, async ({ page }) => {
	await page.goto(`/reference/books/authors`);
	await waitForSignedIn(page);
	const firstAuthor = page.locator(`a.author-card`).first();
	await firstAuthor.waitFor();
	await firstAuthor.click();
	await captureRouteAtAllWidths(page, `author-detail`);
});

test(`screenshot series detail (via /reference/books/series)`, async ({ page }) => {
	await page.goto(`/reference/books/series`);
	await waitForSignedIn(page);
	const firstSeries = page.locator(`a.series-card`).first();
	await firstSeries.waitFor();
	await firstSeries.click();
	await captureRouteAtAllWidths(page, `series-detail`);
});
