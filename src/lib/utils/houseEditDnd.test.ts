import { describe, it, expect } from 'vitest';
import { buildHouseSaveOps, type HouseBoard } from './houseEditDnd';

function emptyBoard(): HouseBoard {
	return { areas: [], items: [], deletedAreaIds: [], deletedItemIds: [] };
}

describe(`buildHouseSaveOps`, () => {
	it(`produces no ops for an unmodified board`, () => {
		const board = emptyBoard();
		board.areas.push({
			id: `kitchen`, kind: `existing`, start: [1, 2], size: [3, 4], colour: `red`,
			originalStart: [1, 2], originalSize: [3, 4], originalColour: `red`,
		});
		board.items.push({
			id: `lightkitchen`, kind: `existing`, type: `light`, area: `kitchen`, start: [5, 6], size: null, rotation: null, linkedItem: null,
			originalArea: `kitchen`, originalStart: [5, 6], originalSize: null, originalRotation: null,
		});

		expect(buildHouseSaveOps(board)).toEqual({ areaOps: [], itemOps: [] });
	});

	it(`creates a create op for a draft area/item`, () => {
		const board = emptyBoard();
		board.areas.push({ id: `newarea`, kind: `draft`, start: [10, 10], size: [50, 50], colour: null });
		board.items.push({ id: `lightnew`, kind: `draft`, type: `light`, area: `newarea`, start: [15, 15], size: null, rotation: null, linkedItem: null });

		const { areaOps, itemOps } = buildHouseSaveOps(board);

		expect(areaOps).toEqual([{ type: `create`, id: `newarea`, start: [10, 10], size: [50, 50], colour: null }]);
		expect(itemOps).toEqual([{ type: `create`, id: `lightnew`, itemType: `light`, area: `newarea`, start: [15, 15], size: null, rotation: null }]);
	});

	it(`creates an update op only when start/size/colour actually changed (area)`, () => {
		const board = emptyBoard();
		board.areas.push({
			id: `kitchen`, kind: `existing`, start: [9, 9], size: [3, 4], colour: `red`,
			originalStart: [1, 2], originalSize: [3, 4], originalColour: `red`,
		});

		const { areaOps } = buildHouseSaveOps(board);

		expect(areaOps).toEqual([{ type: `update`, id: `kitchen`, start: [9, 9], size: [3, 4], colour: `red` }]);
	});

	it(`creates an update op when an item's area/start/rotation changed`, () => {
		const board = emptyBoard();
		board.items.push({
			id: `lightkitchen`, kind: `existing`, type: `light`, area: null, start: [5, 6], size: null, rotation: 90,
			linkedItem: null, originalArea: `kitchen`, originalStart: [5, 6], originalSize: null, originalRotation: null,
		});

		const { itemOps } = buildHouseSaveOps(board);

		expect(itemOps).toEqual([{ type: `update`, id: `lightkitchen`, itemType: `light`, area: null, start: [5, 6], size: null, rotation: 90 }]);
	});

	it(`includes a delete op for every deleted id, regardless of other changes`, () => {
		const board = emptyBoard();
		board.deletedAreaIds.push(`oldarea`);
		board.deletedItemIds.push(`olditem1`, `olditem2`);

		const { areaOps, itemOps } = buildHouseSaveOps(board);

		expect(areaOps).toEqual([{ type: `delete`, id: `oldarea` }]);
		expect(itemOps).toEqual([{ type: `delete`, id: `olditem1` }, { type: `delete`, id: `olditem2` }]);
	});
});
