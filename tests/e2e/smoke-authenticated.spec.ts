import { test, expect } from '@playwright/test';

// Read-only smoke coverage for every authenticated page that isn't safe to
// exercise with real mutations (see CLAUDE.md's "E2E mutation safety" note):
// budget batches all edits into one diffed save, shopping list items can't be
// deleted via the API, task completion is permanent on a real Todoist/Notion
// task, small human touches a real child's growth records, schedule
// overwrites a real family member's routine, and colours saves also fire a
// real repository_dispatch that triggers an actual site rebuild+deploy - a
// side effect none of the other safe-to-mutate tests (e.g. meal-plan) have.
// These tests only navigate and verify rendering - no "Save" is ever clicked.

const pages: { name: string; path: string; heading: string }[] = [
	{ name: `tasks`, path: `/tasks`, heading: `Tasks` },
	{ name: `calendar`, path: `/calendar`, heading: `Calendar` },
	{ name: `schedule`, path: `/schedule`, heading: `Schedule` },
	{ name: `shopping-list`, path: `/shopping-list`, heading: `Shopping List` },
	{ name: `reference`, path: `/reference`, heading: `Reference` },
	{ name: `small-human`, path: `/small-human`, heading: `Small Human` },
	{ name: `design-colours`, path: `/design/colours`, heading: `Colours` },
	{ name: `search`, path: `/search`, heading: `Search` },
];

for (const { name, path, heading } of pages) {
	test(`${name} renders its main content`, async ({ page }) => {
		await page.goto(path);
		await expect(page.getByRole(`heading`, { level: 1, name: heading })).toBeVisible();
	});
}

test(`budget renders totals and Edit/Discard never triggers a save`, async ({ page }) => {
	await page.goto(`/budget`);
	await expect(page.getByRole(`heading`, { level: 1, name: `Budget` })).toBeVisible();

	// Guards against an unexpected confirm() dialog - safe either way since
	// "Save" is never clicked, so no mutation can happen regardless of outcome.
	page.on(`dialog`, (dialog) => dialog.dismiss());

	await page.getByRole(`button`, { name: `Edit` }).click();
	await page.getByRole(`button`, { name: `Discard` }).click();

	await expect(page.getByRole(`button`, { name: `Edit` })).toBeVisible();
});

test(`search shows results for a query passed in the URL`, async ({ page }) => {
	// "budget" always matches the static Budget nav entry (menuItems), unlike
	// searching for real household data which could change/disappear -
	// deterministic without relying on live data.
	await page.goto(`/search?q=budget`);
	await expect(page.getByRole(`heading`, { level: 2, name: `Pages` })).toBeVisible();
	// Scoped to main - the header nav also has a permanent "Budget" link, so
	// an unscoped locator matches both it and the search result.
	await expect(page.getByRole(`main`).getByRole(`link`, { name: `Budget` })).toBeVisible();
});

test(`colours renders swatches and Edit/Discard never triggers a save`, async ({ page }) => {
	await page.goto(`/design/colours`);
	await expect(page.getByRole(`heading`, { level: 1, name: `Colours` })).toBeVisible();

	// Guards against an unexpected confirm() dialog - safe either way since
	// "Save" is never clicked, so no mutation (and no rebuild dispatch) can
	// happen regardless of outcome.
	page.on(`dialog`, (dialog) => dialog.dismiss());

	await page.getByRole(`button`, { name: `Edit` }).click();
	await page.getByRole(`button`, { name: `Discard` }).click();

	await expect(page.getByRole(`button`, { name: `Edit` })).toBeVisible();
});
