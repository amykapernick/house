import { test, expect, type Page } from '@playwright/test';
import '@clerk/testing/playwright'; // augments Window with a `Clerk` type

// Drives svelte-dnd-action's keyboard drag-and-drop path (Space to pick up/
// drop, Tab to move focus - and the dragged item - between dnd-zones) since
// simulated mouse-drag sequences are notoriously flaky in Playwright and the
// library documents keyboard operation as a first-class path.
//
// Tabs until focus lands on *any* day's meals dndzone, rather than a
// pre-chosen one. Predicting a specific target zone up front is unreliable:
// during an active keyboard drag, svelte-dnd-action re-syncs the dragged
// item's tentative position as focus moves between zones (mid-flight with
// its own flip animation), so by the time enough Tab presses have landed on
// a zone that *used to be* the resolved target, the item can end up
// somewhere else entirely. Since this test only cares that a recipe can be
// dropped and later edited/deleted - not which specific day it lands on -
// landing on the first reachable zone and locating the dropped item
// afterwards sidesteps that race.
async function tabUntilOnMealsZone(page: Page, maxTabs = 40) {
	for (let i = 0; i < maxTabs; i++) {
		const onZone = await page.evaluate(() => {
			const el = document.activeElement;
			return el?.getAttribute(`role`) === `list` && /meals$/.test(el?.getAttribute(`aria-label`) ?? ``);
		});
		if (onZone) return;
		await page.keyboard.press(`Tab`);
		// svelte-dnd-action re-syncs the dragged item's tentative position and
		// runs a flip animation (MEAL_PLANNING_FLIP_MS) on every zone change -
		// pressing Tab faster than that settles can outrun its own focus
		// management, so give each press a moment to land.
		await page.waitForTimeout(50);
	}
	throw new Error(`Could not reach a day's meals zone via Tab within ${maxTabs} presses`);
}

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
		await page.getByRole(`button`, { name: `Start meal planning` }).click();
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

		// `.meal` isn't a real selector - MealPlanningDay's card styling comes
		// from a CSS module, so its rendered class is hashed (e.g.
		// `_meal_dz28r_38`), never the literal token "meal". Its role and the
		// dndzone's own aria-label (see MEAL_PLANNING zones) are stable instead.
		const mealCard = page.locator(`[aria-label$="meals"]`).getByRole(`listitem`).filter({ hasText: marker });
		await mealCard.getByRole(`button`, { name: `Edit meal` }).click();

		const editDialog = page.getByRole(`dialog`);
		await editDialog.getByRole(`button`, { name: `Delete` }).click();

		await expect(page.getByText(marker)).not.toBeVisible();
		createdId = null; // cleaned up via the UI - afterEach safety net is now a no-op
	});
});

test.describe(`meal planning mode`, () => {
	// Only the palette -> day drop (a create) gets e2e coverage here. Dragging
	// an *existing* saved entry between days (an update) is deliberately left
	// untested: compounding two mutation types with cross-zone keyboard dnd in
	// one flow is disproportionately flaky for the marginal extra coverage.
	let createdId: string | null = null;
	let graphqlUrl: string;

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

	test(`drags a season recipe onto a day, saves it, then deletes it via the UI`, async ({ page }) => {
		await page.goto(`/meal-plan`);
		await page.getByRole(`button`, { name: `Start meal planning` }).click();
		await page.getByRole(`radio`, { name: `1 week` }).check();
		await expect(page.getByText(`Loading recipes...`)).toBeHidden();
		// The days grid has its own separate "Loading..." state (the meal plan
		// itself, distinct from the recipe palette above) - without waiting for
		// it too, the empty-day detection below can catch a day mid-fetch and
		// call it empty just before its real entries load in.
		await expect(page.getByText(`Loading...`, { exact: true })).toBeHidden();

		// Season tagging in Mealie is an ongoing effort - if the current season
		// has no tagged recipes yet, there's nothing to drag, so skip rather
		// than fail (this test can't control Mealie's live tag data).
		const paletteList = page.getByRole(`list`, { name: /recipes$/ });
		if ((await paletteList.count()) === 0) {
			test.skip(true, `No Mealie recipes are currently tagged for this season`);
		}

		const firstCard = paletteList.getByRole(`listitem`).first();
		const recipeName = await firstCard.getAttribute(`aria-label`);
		expect(recipeName, `expected the palette card to have an aria-label`).toBeTruthy();

		await firstCard.focus();
		await page.keyboard.press(`Space`); // pick up
		await page.waitForTimeout(100);
		await tabUntilOnMealsZone(page);
		await page.keyboard.press(`Space`); // drop

		// See the create+delete test above for why `.meal` can't be used -
		// scoped to the meals dndzone (not `main`/`getByRole('listitem')`
		// alone) since the still-visible palette card shares the same text.
		const droppedMeal = page.locator(`[aria-label$="meals"]`).getByRole(`listitem`).filter({ hasText: recipeName! });
		await expect(droppedMeal).toBeVisible();
		await expect(droppedMeal.getByText(`New`)).toBeVisible();

		const [saveResponse] = await Promise.all([
			page.waitForResponse(
				(res) => res.url() === graphqlUrl && (res.request().postData() ?? ``).includes(`createMealPlanEntry`)
			),
			page.getByRole(`button`, { name: `Save` }).click(),
		]);

		const body = await saveResponse.json();
		createdId = body?.data?.op0?.id ?? null;
		expect(createdId, `expected createMealPlanEntry to return an id`).toBeTruthy();
		await expect(page.getByText(`Unsaved changes`)).toBeHidden();

		await page.getByRole(`button`, { name: `Exit planning` }).click();
		// Scoped to the day grid: an unscoped getByText also matches
		// svelte-dnd-action's aria-live announcer ("Stopped dragging item
		// ..."), which lingers in the DOM after the drag ends.
		await expect(page.locator(`.week`).getByText(recipeName!)).toBeVisible();

		await page.getByRole(`button`, { name: `Start meal planning` }).click();
		const mealCard = page.locator(`[aria-label$="meals"]`).getByRole(`listitem`).filter({ hasText: recipeName! });
		await mealCard.getByRole(`button`, { name: `Edit meal` }).click();

		const editDialog = page.getByRole(`dialog`);
		await editDialog.getByRole(`button`, { name: `Delete` }).click();

		// Scoped to the day grid: an unscoped getByText also matches the
		// still-visible palette card for this recipe (independent Mealie tag
		// data, unrelated to the now-deleted meal-plan entry).
		await expect(page.locator(`.week`).getByText(recipeName!)).not.toBeVisible();
		createdId = null; // cleaned up via the UI - afterEach safety net is now a no-op
	});
});
