<script lang="ts">
	import HouseMap from '$partials/HouseMap.svelte';
	import HouseAreaModal from '$partials/house/HouseAreaModal.svelte';
	import HouseItemModal from '$partials/house/HouseItemModal.svelte';
	import Modal from '$parts/Modal.svelte';
	import { isAuthenticated, getToken } from '$lib/auth';
	import fetchClientData, { getGraphqlUrl, clearCache } from '$utils/fetchClientData';
	import { beforeNavigate } from '$app/navigation';
	import { buildHouseSaveOps, type HouseBoard, type DraftHouseArea, type DraftHouseItem } from '$utils/houseEditDnd';
	import type { Area, Item } from '$types/house';

	const MAP_SIZE = [1189, 1593];

	let areas = $state<Area[]>([]);
	let items = $state<Item[]>([]);
	let loading = $state(true);

	const HOUSE_QUERY = `
		query {
			areas {
				id
				name
				start
				size
				link
				colour
				info {
					value
					type
				}
			}
			items {
				id
				type
				state {
					type
					state
				}
				start
				size
				rotation
				link
				area {
					id
					name
					colour
				}
			}
		}
	`;

	function handleHouse(res: any) {
		areas = res.areas ?? [];
		items = res.items ?? [];
		loading = false;
	}

	function fetchHouse(force = false) {
		fetchClientData({
			cacheKey: `house`,
			onStale: handleHouse,
			ttl: 5 * 60 * 1000,
			skipCache: force,
			gqlQuery: HOUSE_QUERY,
		}).then(handleHouse);
	}

	$effect(() => {
		if ($isAuthenticated) fetchHouse();
	});

	// ── Edit mode ──────────────────────────────────────────────────────────
	// A local working copy (houseBoard) that drags/adds/edits/deletes mutate directly - nothing
	// reaches the API until Save. Mirrors meal-plan's planningMode/planningBoard pattern.

	let editMode = $state(false);
	let houseBoard = $state<HouseBoard>({ areas: [], items: [], deletedAreaIds: [], deletedItemIds: [] });
	let colourOptions = $state<string[]>([]);
	let saving = $state(false);
	let saveError = $state(``);

	let dirty = $derived.by(() => {
		const { areaOps, itemOps } = buildHouseSaveOps(houseBoard);
		return areaOps.length > 0 || itemOps.length > 0;
	});

	let editModeAreas = $derived<Area[]>(
		houseBoard.areas.map((a) => ({
			id: a.id,
			name: a.id,
			start: a.start,
			size: a.size,
			colour: a.colour ?? undefined,
			items: [],
			info: [],
		}))
	);

	let editModeItems = $derived<Item[]>(
		houseBoard.items.map((i) => ({
			id: i.id,
			type: i.type as Item[`type`],
			start: i.start,
			size: i.size ?? undefined,
			rotation: i.rotation ?? undefined,
			area: i.area ? { id: i.area, name: i.area, start: [0, 0], size: [0, 0], items: [], info: [] } : null,
		}))
	);

	let areaSelectOptions = $derived(houseBoard.areas.map((a) => ({ value: a.id, label: a.id })));

	async function fetchRawHouse() {
		const res = await fetchClientData({
			skipCache: true,
			gqlQuery: `
				query {
					areas { id start size colour }
					items(raw: true) {
						id
						type
						area { id }
						start
						size
						rotation
						linkedItem { id type }
					}
				}
			`,
		});

		houseBoard = {
			areas: (res.areas ?? []).map((a: any): DraftHouseArea => {
				const colour = a.colour === `transparent` ? null : a.colour;
				return {
					id: a.id,
					kind: `existing`,
					start: [a.start[0], a.start[1]],
					size: [a.size[0], a.size[1]],
					colour,
					originalStart: [a.start[0], a.start[1]],
					originalSize: [a.size[0], a.size[1]],
					originalColour: colour,
				};
			}),
			items: (res.items ?? []).map((i: any): DraftHouseItem => {
				const area = i.area?.id ?? null;
				const start: [number, number] = [i.start[0], i.start[1]];
				const size: [number, number] | null = i.size ? [i.size[0], i.size[1]] : null;
				const rotation = i.rotation ?? null;
				return {
					id: i.id,
					kind: `existing`,
					type: i.type,
					area,
					start,
					size,
					rotation,
					linkedItem: i.linkedItem?.id ?? null,
					originalArea: area,
					originalStart: start,
					originalSize: size,
					originalRotation: rotation,
				};
			}),
			deletedAreaIds: [],
			deletedItemIds: [],
		};
	}

	async function fetchColourOptions() {
		const res = await fetchClientData({
			cacheKey: `colours-base`,
			gqlQuery: `query { colours { name theme } }`,
		});
		const names: string[] = (res.colours ?? []).filter((c: any) => !c.theme).map((c: any) => c.name as string);
		colourOptions = [...new Set(names)];
	}

	async function startEditMode() {
		editMode = true;
		saveError = ``;
		await Promise.all([fetchRawHouse(), fetchColourOptions()]);
	}

	function exitEditMode() {
		if (dirty && !confirm(`Discard unsaved house map changes?`)) return;
		editMode = false;
		saveError = ``;
	}

	beforeNavigate(({ cancel }) => {
		if (editMode && dirty && !confirm(`Discard unsaved house map changes?`)) cancel();
	});

	$effect(() => {
		if (!(editMode && dirty)) return;

		function handler(e: BeforeUnloadEvent) {
			e.preventDefault();
		}
		window.addEventListener(`beforeunload`, handler);
		return () => window.removeEventListener(`beforeunload`, handler);
	});

	// ── Drag / map click ─────────────────────────────────────────────────────

	let lastClickedPoint = $state<[number, number] | null>(null);

	function handleAreaDrag(id: string, start: [number, number]) {
		const area = houseBoard.areas.find((a) => a.id === id);
		if (area) area.start = start;
	}

	function handleAreaResize(id: string, newSize: [number, number]) {
		const area = houseBoard.areas.find((a) => a.id === id);
		if (area) area.size = newSize;
	}

	function handleItemDrag(id: string, start: [number, number]) {
		const item = houseBoard.items.find((i) => i.id === id);
		if (item) item.start = start;
	}

	function handleMapClick(point: [number, number]) {
		lastClickedPoint = point;
	}

	// ── Area modal ─────────────────────────────────────────────────────────

	let areaModalOpen = $state(false);
	let areaModalMode = $state<`create` | `edit`>(`create`);
	let areaModalId = $state(``);
	let areaModalEntityLabel = $state<string | null>(null);
	let areaModalStartX = $state(0);
	let areaModalStartY = $state(0);
	let areaModalSizeWidth = $state(100);
	let areaModalSizeHeight = $state(100);
	let areaModalColour = $state(``);
	let editingAreaId = $state<string | null>(null);

	let areaPickerOpen = $state(false);
	let availableAreaEntities = $state<{ id: string; name: string }[]>([]);

	async function openAreaPicker() {
		saveError = ``;
		const res = await fetchClientData({
			skipCache: true,
			gqlQuery: `query { availableHouseAreas { id name } }`,
		});
		availableAreaEntities = res.availableHouseAreas ?? [];
		areaPickerOpen = true;
	}

	function pickAreaEntity(entity: (typeof availableAreaEntities)[number]) {
		areaPickerOpen = false;
		areaModalMode = `create`;
		areaModalId = entity.id;
		areaModalEntityLabel = entity.name;
		const [x, y] = lastClickedPoint ?? [MAP_SIZE[0] / 2 - 50, MAP_SIZE[1] / 2 - 50];
		areaModalStartX = Math.round(x);
		areaModalStartY = Math.round(y);
		areaModalSizeWidth = 100;
		areaModalSizeHeight = 100;
		areaModalColour = ``;
		editingAreaId = null;
		areaModalOpen = true;
	}

	function openEditAreaModal(id: string) {
		const area = houseBoard.areas.find((a) => a.id === id);
		if (!area) return;
		areaModalMode = `edit`;
		areaModalId = area.id;
		areaModalEntityLabel = null;
		areaModalStartX = Math.round(area.start[0]);
		areaModalStartY = Math.round(area.start[1]);
		areaModalSizeWidth = Math.round(area.size[0]);
		areaModalSizeHeight = Math.round(area.size[1]);
		areaModalColour = area.colour ?? ``;
		editingAreaId = id;
		areaModalOpen = true;
	}

	function saveAreaModal() {
		const start: [number, number] = [areaModalStartX, areaModalStartY];
		const size: [number, number] = [areaModalSizeWidth, areaModalSizeHeight];
		const colour = areaModalColour || null;

		if (areaModalMode === `create`) {
			houseBoard.areas.push({ id: areaModalId, kind: `draft`, start, size, colour });
		}
		else if (editingAreaId) {
			const area = houseBoard.areas.find((a) => a.id === editingAreaId);
			if (area) {
				area.start = start;
				area.size = size;
				area.colour = colour;
			}
		}
		areaModalOpen = false;
	}

	function deleteAreaFromModal() {
		if (!editingAreaId) return;
		const id = editingAreaId;
		const area = houseBoard.areas.find((a) => a.id === id);

		houseBoard.areas = houseBoard.areas.filter((a) => a.id !== id);
		if (area?.kind === `existing`) houseBoard.deletedAreaIds.push(id);
		// Orphan (don't delete) any items that were in this area, matching deleteHouseArea's
		// server-side behaviour.
		houseBoard.items.forEach((item) => {
			if (item.area === id) item.area = null;
		});

		areaModalOpen = false;
	}

	// ── Item modal / available-entities picker ──────────────────────────────

	let itemModalOpen = $state(false);
	let itemModalMode = $state<`create` | `edit`>(`create`);
	let itemModalId = $state(``);
	let itemModalEntityLabel = $state<string | null>(null);
	let itemModalType = $state(`light`);
	let itemModalArea = $state(``);
	let itemModalStartX = $state(0);
	let itemModalStartY = $state(0);
	let itemModalRotation = $state(0);
	let itemModalLinkedLabel = $state<string | null>(null);
	let editingItemId = $state<string | null>(null);

	let pickerOpen = $state(false);
	let availableEntities = $state<
		{ id: string; entityId: string; friendlyName: string | null; suggestedType: string | null; suggestedArea: string | null }[]
	>([]);

	async function openItemPicker() {
		saveError = ``;
		const res = await fetchClientData({
			skipCache: true,
			gqlQuery: `query { availableHouseItems { id entityId friendlyName suggestedType suggestedArea } }`,
		});
		availableEntities = res.availableHouseItems ?? [];
		pickerOpen = true;
	}

	function pickEntity(entity: (typeof availableEntities)[number]) {
		pickerOpen = false;
		itemModalMode = `create`;
		itemModalId = entity.id;
		itemModalEntityLabel = entity.friendlyName ? `${entity.friendlyName} (${entity.entityId})` : entity.entityId;
		itemModalType = entity.suggestedType ?? `light`;
		itemModalArea = entity.suggestedArea ?? ``;
		const [x, y] = lastClickedPoint ?? [MAP_SIZE[0] / 2, MAP_SIZE[1] / 2];
		itemModalStartX = Math.round(x);
		itemModalStartY = Math.round(y);
		itemModalRotation = 0;
		itemModalLinkedLabel = null;
		editingItemId = null;
		itemModalOpen = true;
	}

	function openEditItemModal(id: string) {
		const item = houseBoard.items.find((i) => i.id === id);
		if (!item) return;
		itemModalMode = `edit`;
		itemModalId = item.id;
		itemModalEntityLabel = null;
		itemModalType = item.type;
		itemModalArea = item.area ?? ``;
		itemModalStartX = Math.round(item.start[0]);
		itemModalStartY = Math.round(item.start[1]);
		itemModalRotation = item.rotation ?? 0;
		const linked = item.linkedItem ? houseBoard.items.find((i) => i.id === item.linkedItem) : null;
		itemModalLinkedLabel = linked ? `${linked.type} (${linked.id})` : null;
		editingItemId = id;
		itemModalOpen = true;
	}

	function saveItemModal() {
		const start: [number, number] = [itemModalStartX, itemModalStartY];
		const area = itemModalArea || null;

		if (itemModalMode === `create`) {
			houseBoard.items.push({
				id: itemModalId,
				kind: `draft`,
				type: itemModalType,
				area,
				start,
				size: null,
				rotation: itemModalRotation || null,
				linkedItem: null,
			});
		}
		else if (editingItemId) {
			const item = houseBoard.items.find((i) => i.id === editingItemId);
			if (item) {
				item.type = itemModalType;
				item.area = area;
				item.start = start;
				item.rotation = itemModalRotation || null;
			}
		}
		itemModalOpen = false;
	}

	function deleteItemFromModal() {
		if (!editingItemId) return;
		const id = editingItemId;
		const item = houseBoard.items.find((i) => i.id === id);

		houseBoard.items = houseBoard.items.filter((i) => i.id !== id);
		if (item?.kind === `existing`) houseBoard.deletedItemIds.push(id);

		itemModalOpen = false;
	}

	// ── Save ─────────────────────────────────────────────────────────────

	const gqlStr = (value: string) => JSON.stringify(value);
	const gqlNum = (value: number | null) => (value === null ? `null` : String(value));
	const gqlArr = (value: [number, number] | null) => (value === null ? `null` : `[${value[0]}, ${value[1]}]`);

	async function postMutation(mutation: string) {
		const token = await getToken();
		return fetch(getGraphqlUrl(), {
			method: `POST`,
			headers: {
				'Content-Type': `application/json`,
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
			body: JSON.stringify({ query: mutation }),
		}).then((r) => r.json());
	}

	async function handleSaveHouse() {
		const { areaOps, itemOps } = buildHouseSaveOps(houseBoard);
		if (!areaOps.length && !itemOps.length) return;

		saving = true;
		saveError = ``;

		const fields: string[] = [];
		let i = 0;

		for (const op of areaOps) {
			if (op.type === `delete`) {
				fields.push(`op${i}: deleteHouseArea(id: ${gqlStr(op.id)}) { success }`);
			}
			else {
				const input = `{ id: ${gqlStr(op.id)}, start: ${gqlArr(op.start)}, size: ${gqlArr(op.size)}, colour: ${op.colour === null ? `null` : gqlStr(op.colour)} }`;
				const call = op.type === `create` ? `createHouseArea(input: ${input})` : `updateHouseArea(id: ${gqlStr(op.id)}, input: ${input})`;
				fields.push(`op${i}: ${call} { id }`);
			}
			i++;
		}

		for (const op of itemOps) {
			if (op.type === `delete`) {
				fields.push(`op${i}: deleteHouseItem(id: ${gqlStr(op.id)}) { success }`);
			}
			else {
				const input = `{ id: ${gqlStr(op.id)}, type: ${op.itemType}, area: ${op.area === null ? `null` : gqlStr(op.area)}, start: ${gqlArr(op.start)}, size: ${gqlArr(op.size)}, rotation: ${gqlNum(op.rotation)} }`;
				const call = op.type === `create` ? `createHouseItem(input: ${input})` : `updateHouseItem(id: ${gqlStr(op.id)}, input: ${input})`;
				fields.push(`op${i}: ${call} { id }`);
			}
			i++;
		}

		const res = await postMutation(`mutation {\n${fields.join(`\n`)}\n}`);
		saving = false;

		if (res?.errors) {
			saveError = `Failed to save house map.`;
			return;
		}

		clearCache(`house`);
		await fetchRawHouse();
		fetchHouse(true);
	}
</script>

<svelte:head>
	<title>House | Kapers Crewe Household</title>
</svelte:head>

<h1>House</h1>

{#if $isAuthenticated}
	<div class="toolbar">
		{#if !editMode}
			<button type="button" onclick={startEditMode}>Edit map</button>
		{:else}
			<button type="button" onclick={openAreaPicker}>Add area</button>
			<button type="button" onclick={openItemPicker}>Add item</button>
			{#if dirty}<span class="unsaved">Unsaved changes</span>{/if}
			<button type="button" onclick={handleSaveHouse} disabled={saving || !dirty}>
				{saving ? `Saving…` : `Save`}
			</button>
			<button type="button" onclick={exitEditMode} disabled={saving}>Done</button>
		{/if}
	</div>
	{#if saveError}<p class="error">{saveError}</p>{/if}
{/if}

{#if loading}
	<p>Loading...</p>
{:else if editMode}
	<HouseMap
		areas={editModeAreas}
		items={editModeItems}
		editMode
		onAreaDrag={handleAreaDrag}
		onAreaResize={handleAreaResize}
		onItemDrag={handleItemDrag}
		onAreaClick={openEditAreaModal}
		onItemClick={openEditItemModal}
		onMapClick={handleMapClick}
	/>
{:else}
	<HouseMap {areas} {items} />
{/if}

<Modal bind:open={pickerOpen} title="Add item">
	{#if availableEntities.length === 0}
		<p>Nothing left to add - tag more entities with <code>house_app</code> in Home Assistant first.</p>
	{:else}
		<ul class="picker_list">
			{#each availableEntities as entity (entity.id)}
				<li>
					<button type="button" onclick={() => pickEntity(entity)}>
						{entity.friendlyName ?? entity.entityId}
						<span class="entity_id">{entity.entityId}</span>
					</button>
				</li>
			{/each}
		</ul>
	{/if}
	<button type="button" onclick={() => (pickerOpen = false)}>Cancel</button>
</Modal>

<Modal bind:open={areaPickerOpen} title="Add area">
	{#if availableAreaEntities.length === 0}
		<p>Nothing left to add - every configured Home Assistant area already has a house map area.</p>
	{:else}
		<ul class="picker_list">
			{#each availableAreaEntities as entity (entity.id)}
				<li>
					<button type="button" onclick={() => pickAreaEntity(entity)}>{entity.name}</button>
				</li>
			{/each}
		</ul>
	{/if}
	<button type="button" onclick={() => (areaPickerOpen = false)}>Cancel</button>
</Modal>

<HouseAreaModal
	bind:open={areaModalOpen}
	mode={areaModalMode}
	id={areaModalId}
	entityLabel={areaModalEntityLabel}
	bind:startX={areaModalStartX}
	bind:startY={areaModalStartY}
	bind:sizeWidth={areaModalSizeWidth}
	bind:sizeHeight={areaModalSizeHeight}
	bind:colour={areaModalColour}
	{colourOptions}
	onSave={saveAreaModal}
	onDelete={areaModalMode === `edit` ? deleteAreaFromModal : undefined}
/>

<HouseItemModal
	bind:open={itemModalOpen}
	mode={itemModalMode}
	id={itemModalId}
	entityLabel={itemModalEntityLabel}
	bind:type={itemModalType}
	bind:area={itemModalArea}
	bind:startX={itemModalStartX}
	bind:startY={itemModalStartY}
	bind:rotation={itemModalRotation}
	linkedItemLabel={itemModalLinkedLabel}
	areaOptions={areaSelectOptions}
	onSave={saveItemModal}
	onDelete={itemModalMode === `edit` ? deleteItemFromModal : undefined}
/>

<style>
	.toolbar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5em;
		margin-bottom: 1em;
	}

	.unsaved {
		color: var(--orange);
		font-size: 0.9em;
	}

	.error {
		color: var(--red);
	}

	.picker_list {
		margin: 0 0 1em;
		padding: 0;
		list-style: none;
		max-height: 50vh;
		overflow-y: auto;

		& li {
			margin: 0;
		}

		& button {
			display: flex;
			flex-direction: column;
			align-items: flex-start;
			width: 100%;
			padding: 0.5em 0.75em;
			border: none;
			background: none;
			text-align: left;
			cursor: pointer;

			&:hover {
				background: color-mix(in srgb, var(--purple_bright) 8%, transparent);
			}
		}

		& .entity_id {
			color: var(--grey);
			font-size: 0.8em;
		}
	}
</style>
