// Pure diff logic for the house map's edit mode - kept separate from +page.svelte so it's
// testable without touching the DOM or drag events, same split as mealPlanningDnd.ts.

export type DraftHouseArea = {
	id: string;
	kind: `existing` | `draft`;
	start: [number, number];
	size: [number, number];
	colour: string | null;
	originalStart?: [number, number];
	originalSize?: [number, number];
	originalColour?: string | null;
};

export type DraftHouseItem = {
	id: string;
	kind: `existing` | `draft`;
	type: string;
	area: string | null;
	start: [number, number];
	size: [number, number] | null;
	rotation: number | null;
	linkedItem: string | null;
	originalArea?: string | null;
	originalStart?: [number, number];
	originalSize?: [number, number] | null;
	originalRotation?: number | null;
};

export type HouseBoard = {
	areas: DraftHouseArea[];
	items: DraftHouseItem[];
	deletedAreaIds: string[];
	deletedItemIds: string[];
};

export type AreaSaveOp =
	| { type: `create`; id: string; start: [number, number]; size: [number, number]; colour: string | null }
	| { type: `update`; id: string; start: [number, number]; size: [number, number]; colour: string | null }
	| { type: `delete`; id: string };

export type ItemSaveOp =
	| { type: `create`; id: string; itemType: string; area: string | null; start: [number, number]; size: [number, number] | null; rotation: number | null }
	| { type: `update`; id: string; itemType: string; area: string | null; start: [number, number]; size: [number, number] | null; rotation: number | null }
	| { type: `delete`; id: string };

function pointEqual(a?: [number, number], b?: [number, number]) {
	if (!a || !b) return a === b;
	return a[0] === b[0] && a[1] === b[1];
}

export function buildHouseSaveOps(board: HouseBoard): { areaOps: AreaSaveOp[]; itemOps: ItemSaveOp[] } {
	const areaOps: AreaSaveOp[] = [];

	for (const area of board.areas) {
		if (area.kind === `draft`) {
			areaOps.push({ type: `create`, id: area.id, start: area.start, size: area.size, colour: area.colour });
			continue;
		}

		const changed = !pointEqual(area.start, area.originalStart)
			|| !pointEqual(area.size, area.originalSize)
			|| area.colour !== area.originalColour;

		if (changed) areaOps.push({ type: `update`, id: area.id, start: area.start, size: area.size, colour: area.colour });
	}
	for (const id of board.deletedAreaIds) areaOps.push({ type: `delete`, id });

	const itemOps: ItemSaveOp[] = [];

	for (const item of board.items) {
		if (item.kind === `draft`) {
			itemOps.push({ type: `create`, id: item.id, itemType: item.type, area: item.area, start: item.start, size: item.size, rotation: item.rotation });
			continue;
		}

		const changed = item.area !== item.originalArea
			|| !pointEqual(item.start, item.originalStart)
			|| !pointEqual(item.size ?? undefined, item.originalSize ?? undefined)
			|| item.rotation !== item.originalRotation;

		if (changed) itemOps.push({ type: `update`, id: item.id, itemType: item.type, area: item.area, start: item.start, size: item.size, rotation: item.rotation });
	}
	for (const id of board.deletedItemIds) itemOps.push({ type: `delete`, id });

	return { areaOps, itemOps };
}
