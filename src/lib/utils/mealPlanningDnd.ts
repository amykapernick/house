// Shared between the meal-plan page and its two dnd-zone components, so all
// zones agree on the same item shape/type and the "what needs saving" logic
// stays testable without touching the DOM or svelte-dnd-action.

export const MEAL_PLANNING_DND_TYPE = `meal-planning`;
export const MEAL_PLANNING_FLIP_MS = 200;

export type PlanningRecipe = {
	id: string;
	name: string;
	slug: string;
	image: string | null;
	totalTime: string | null;
	servings: number | null;
};

export type PaletteDndItem = { id: string; kind: `palette`; recipe: PlanningRecipe };

export type ExistingDndItem = {
	id: string;
	kind: `existing`;
	date: string;
	originalDate: string;
	entryType: string;
	title: string | null;
	text: string | null;
	recipe: PlanningRecipe | null;
};

export type DraftDndItem = {
	id: string;
	kind: `draft`;
	date: string;
	entryType: string;
	recipe: PlanningRecipe;
};

export type PlanningDndItem = ExistingDndItem | DraftDndItem;

export type PlanningDay = { date: string; items: PlanningDndItem[] };

// Called by a day zone's `finalize` handler for every item now in that day.
// Converts a freshly-dropped palette item into a real draft (a *new* id, per
// svelte-dnd-action's own "allocate a new id for the copy" convention), and
// stamps `date` on anything (draft or existing) that just moved here.
export function resolveDroppedItem(item: PaletteDndItem | PlanningDndItem, date: string): PlanningDndItem {
	if (item.kind === `palette`) {
		return { id: crypto.randomUUID(), kind: `draft`, date, entryType: `dinner`, recipe: item.recipe };
	}
	return { ...item, date };
}

export type SaveOp =
	| { type: `create`; date: string; entryType: string; recipeId: string }
	| { type: `update`; id: string; date: string; entryType: string; recipeId: string | null; title: string | null; text: string | null };

// Pure: figure out which planning-board items actually need a mutation.
// Existing items only produce an op if their date changed from originalDate
// - including "moved out and back to the same day", which nets to no-op.
export function buildMealPlanSaveOps(days: PlanningDay[]): SaveOp[] {
	const ops: SaveOp[] = [];

	for (const day of days) {
		for (const item of day.items) {
			if (item.kind === `draft`) {
				ops.push({ type: `create`, date: item.date, entryType: item.entryType, recipeId: item.recipe.id });
			}
			else if (item.date !== item.originalDate) {
				ops.push({
					type: `update`,
					id: item.id,
					date: item.date,
					entryType: item.entryType,
					recipeId: item.recipe?.id ?? null,
					title: item.title,
					text: item.text,
				});
			}
		}
	}

	return ops;
}
