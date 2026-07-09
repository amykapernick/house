import { describe, it, expect } from 'vitest';
import { buildMealPlanSaveOps, resolveDroppedItem, type PlanningDay, type PlanningRecipe } from './mealPlanningDnd';

const recipe: PlanningRecipe = { id: `recipe-1`, name: `Soup`, slug: `soup`, image: null, totalTime: null, servings: null };

describe(`buildMealPlanSaveOps`, () => {
	it(`returns nothing for a board with only untouched existing items`, () => {
		const days: PlanningDay[] = [
			{
				date: `2026-07-11`,
				items: [
					{ id: `1`, kind: `existing`, date: `2026-07-11`, originalDate: `2026-07-11`, entryType: `dinner`, title: `Leftovers`, text: null, recipe: null },
				],
			},
		];

		expect(buildMealPlanSaveOps(days)).toEqual([]);
	});

	it(`emits a create op for a draft item`, () => {
		const days: PlanningDay[] = [
			{ date: `2026-07-11`, items: [{ id: `draft-1`, kind: `draft`, date: `2026-07-11`, entryType: `dinner`, recipe }] },
		];

		expect(buildMealPlanSaveOps(days)).toEqual([
			{ type: `create`, date: `2026-07-11`, entryType: `dinner`, recipeId: `recipe-1` },
		]);
	});

	it(`emits an update op for an existing item moved to a new day, preserving its other fields`, () => {
		const days: PlanningDay[] = [
			{
				date: `2026-07-12`,
				items: [
					{ id: `1`, kind: `existing`, date: `2026-07-12`, originalDate: `2026-07-11`, entryType: `lunch`, title: null, text: null, recipe },
				],
			},
		];

		expect(buildMealPlanSaveOps(days)).toEqual([
			{ type: `update`, id: `1`, date: `2026-07-12`, entryType: `lunch`, recipeId: `recipe-1`, title: null, text: null },
		]);
	});

	it(`treats a move back to the original day as a no-op`, () => {
		const days: PlanningDay[] = [
			{
				date: `2026-07-11`,
				items: [
					{ id: `1`, kind: `existing`, date: `2026-07-11`, originalDate: `2026-07-11`, entryType: `dinner`, title: null, text: null, recipe },
				],
			},
		];

		expect(buildMealPlanSaveOps(days)).toEqual([]);
	});

	it(`handles a mixed board of untouched, moved, and draft items across days`, () => {
		const days: PlanningDay[] = [
			{
				date: `2026-07-11`,
				items: [
					{ id: `1`, kind: `existing`, date: `2026-07-11`, originalDate: `2026-07-11`, entryType: `dinner`, title: `Takeout`, text: null, recipe: null },
					{ id: `draft-1`, kind: `draft`, date: `2026-07-11`, entryType: `dinner`, recipe },
				],
			},
			{
				date: `2026-07-12`,
				items: [
					{ id: `2`, kind: `existing`, date: `2026-07-12`, originalDate: `2026-07-13`, entryType: `dinner`, title: null, text: `Notes`, recipe },
				],
			},
		];

		expect(buildMealPlanSaveOps(days)).toEqual([
			{ type: `create`, date: `2026-07-11`, entryType: `dinner`, recipeId: `recipe-1` },
			{ type: `update`, id: `2`, date: `2026-07-12`, entryType: `dinner`, recipeId: `recipe-1`, title: null, text: `Notes` },
		]);
	});
});

describe(`resolveDroppedItem`, () => {
	it(`turns a palette item into a new draft with the target date`, () => {
		const result = resolveDroppedItem({ id: `recipe-1`, kind: `palette`, recipe }, `2026-07-11`);

		expect(result.kind).toBe(`draft`);
		expect(result).toMatchObject({ kind: `draft`, date: `2026-07-11`, entryType: `dinner`, recipe });
		expect(result.id).not.toBe(`recipe-1`);
	});

	it(`re-stamps the date on an existing item without changing its id`, () => {
		const item = { id: `1`, kind: `existing` as const, date: `2026-07-11`, originalDate: `2026-07-11`, entryType: `dinner`, title: null, text: null, recipe };

		const result = resolveDroppedItem(item, `2026-07-12`);

		expect(result).toEqual({ ...item, date: `2026-07-12` });
	});

	it(`re-stamps the date on a draft item without changing its kind`, () => {
		const item = { id: `draft-1`, kind: `draft` as const, date: `2026-07-11`, entryType: `dinner`, recipe };

		const result = resolveDroppedItem(item, `2026-07-12`);

		expect(result).toEqual({ ...item, date: `2026-07-12` });
	});
});
