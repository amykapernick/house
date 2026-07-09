import { test, expect } from '@playwright/test';
import '@clerk/testing/playwright'; // augments Window with a `Clerk` type

// The only frontend flow that gets a full mutating E2E test - see CLAUDE.md's
// "E2E mutation safety" note for why every other area stays read-only. Marks
// everything it creates with an `[e2e-test]` prefix and always cleans up: the
// UI's own "Delete" button first, plus an afterEach safety net that deletes
// directly via GraphQL so a mid-test assertion failure can't orphan a real
// entry in production (there's no staging environment for this app).

test.describe(`meal plan entry create + delete`, () => {
	let createdId: string | null = null;
	let graphqlUrl: string;

	// Checked in beforeAll (runs before this file's tests, not during
	// `playwright test --list`'s collection pass) so a missing env var only
	// fails this spec, not test discovery for the whole suite.
	test.beforeAll(() => {
		const API_URL = process.env.VITE_API_URL ?? process.env.API_URL;
		if (!API_URL) {
			throw new Error(
				`VITE_API_URL or API_URL must be set to run this test (needed to build the delete-mutation safety net's endpoint).`
			);
		}
		graphqlUrl = `${API_URL}/graphql`;
	});

	test.afterEach(async ({ page }) => {
		if (!createdId) return;
		const id = createdId;
		createdId = null;

		const token = await page
			.evaluate(() => window.Clerk?.session?.getToken())
			.catch(() => null);

		await page
			.request.post(graphqlUrl, {
				headers: {
					'Content-Type': `application/json`,
					...(token ? { Authorization: `Bearer ${token}` } : {}),
				},
				data: { query: `mutation { deleteMealPlanEntry(id: ${JSON.stringify(id)}) { success } }` },
			})
			.catch(() => {});
	});

	test(`creates a marked entry, verifies it renders, then deletes it via the UI`, async ({ page }) => {
		const marker = `[e2e-test] ${Date.now()}`;

		await page.goto(`/meal-plan`);
		await page.getByRole(`button`, { name: `+ Add meal` }).first().click();

		const createDialog = page.getByRole(`dialog`);
		await createDialog.getByLabel(`Custom`).check();
		await createDialog.getByLabel(`Title`).fill(marker);

		const [response] = await Promise.all([
			page.waitForResponse(
				(res) => res.url() === graphqlUrl && (res.request().postData() ?? ``).includes(`createMealPlanEntry`)
			),
			createDialog.getByRole(`button`, { name: `Add` }).click(),
		]);

		const body = await response.json();
		createdId = body?.data?.createMealPlanEntry?.id ?? null;
		expect(createdId, `expected createMealPlanEntry to return an id`).toBeTruthy();

		await expect(page.getByText(marker)).toBeVisible();

		const mealCard = page.locator(`.meal`, { hasText: marker });
		await mealCard.getByRole(`button`, { name: `Edit meal` }).click();

		const editDialog = page.getByRole(`dialog`);
		await editDialog.getByRole(`button`, { name: `Delete` }).click();

		await expect(page.getByText(marker)).not.toBeVisible();
		createdId = null; // cleaned up via the UI - afterEach safety net is now a no-op
	});
});
