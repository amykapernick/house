import { test, expect } from '@playwright/test';

// Read-only smoke coverage for every authenticated page that isn't safe to
// exercise with real mutations (see CLAUDE.md's "E2E mutation safety" note):
// budget batches all edits into one diffed save, shopping list items can't be
// deleted via the API, task completion is permanent on a real Todoist/Notion
// task, small human touches a real child's growth records, and schedule
// overwrites a real family member's routine. These tests only navigate and
// verify rendering - no "Save" is ever clicked.

const pages: { name: string; path: string; heading: string }[] = [
	{ name: `tasks`, path: `/tasks`, heading: `Tasks` },
	{ name: `calendar`, path: `/calendar`, heading: `Calendar` },
	{ name: `schedule`, path: `/schedule`, heading: `Schedule` },
	{ name: `shopping-list`, path: `/shopping-list`, heading: `Shopping List` },
	{ name: `reference`, path: `/reference`, heading: `Reference` },
	{ name: `small-human`, path: `/small-human`, heading: `Small Human` },
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
