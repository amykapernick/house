<script lang="ts">
	import { format } from 'date-fns';
	import { SvelteDate } from 'svelte/reactivity';
	import { TimeGrid, Interaction } from '@event-calendar/core';
	import CalendarBase from './CalendarBase.svelte';
	import ScheduleBlockModal from './ScheduleBlockModal.svelte';
	import ScheduleSaveModal from './ScheduleSaveModal.svelte';
	import type { ScheduleBlock, ScheduleSavePayload, RoutineDays, PaletteColour } from '$types/schedule';

	let {
		blocks = [],
		colours = [],
		onRangeChange,
		onSave,
	}: {
		blocks: ScheduleBlock[];
		colours?: PaletteColour[];
		onRangeChange?: (start: Date, end: Date) => void;
		onSave?: (payload: ScheduleSavePayload) => Promise<void>;
	} = $props();

	const DEFAULT_COLOUR_NAME = `purple_bright`;

	function resolveColourName(colour: string | null): string {
		if (!colour) return DEFAULT_COLOUR_NAME;
		if (colours.some((c) => c.name === colour)) return colour;
		if (colour.startsWith(`#`)) {
			const match = colours.find((c) => c.hex?.toLowerCase() === colour.toLowerCase());
			if (match) return match.name;
		}
		return DEFAULT_COLOUR_NAME;
	}

	const DAY_KEYS = [`sunday`, `monday`, `tuesday`, `wednesday`, `thursday`, `friday`, `saturday`] as const;
	const LOCAL_DATETIME = `yyyy-MM-dd'T'HH:mm:ss`;

	let editableBlocks = $state<ScheduleBlock[]>([]);
	let hasChanges = $state(false);
	let visibleRange = $state<{ start: Date; end: Date } | null>(null);

	$effect(() => {
		editableBlocks = blocks.map((block) => ({ ...block }));
		hasChanges = false;
	});

	function blocksToRoutineDays(source: ScheduleBlock[]): RoutineDays {
		const days: RoutineDays = { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] };

		for (const block of source) {
			const start = new Date(block.start);
			const dayKey = DAY_KEYS[start.getDay()];
			days[dayKey].push({
				label: block.label,
				start: format(start, `HH:mm`),
				end: format(new Date(block.end), `HH:mm`),
				colour: block.colour,
			});
		}

		for (const key of DAY_KEYS) {
			days[key].sort((a, b) => a.start.localeCompare(b.start));
		}

		return days;
	}

	let calendarEvents = $derived(
		editableBlocks.map((block) => ({
			id: block.id,
			title: block.label,
			start: new Date(block.start),
			end: new Date(block.end),
			allDay: false,
			backgroundColor: block.colour
				? (block.colour.startsWith('#') ? block.colour : `var(--${block.colour})`)
				: 'var(--purple_bright)',
			classNames: block.isOverride ? ['schedule-override'] : [],
		}))
	);

	// Block create/edit modal
	let blockModalOpen = $state(false);
	let blockModalMode = $state<`create` | `edit`>(`create`);
	let draftId = $state(``);
	let draftLabel = $state(``);
	let draftColour = $state(DEFAULT_COLOUR_NAME);
	let draftStart: Date | null = null;
	let draftEnd: Date | null = null;

	function openCreateModal(start: Date, end: Date) {
		blockModalMode = `create`;
		draftId = crypto.randomUUID();
		draftLabel = ``;
		draftColour = DEFAULT_COLOUR_NAME;
		draftStart = start;
		draftEnd = end;
		blockModalOpen = true;
	}

	function openEditModal(block: ScheduleBlock) {
		blockModalMode = `edit`;
		draftId = block.id;
		draftLabel = block.label;
		draftColour = resolveColourName(block.colour);
		draftStart = new Date(block.start);
		draftEnd = new Date(block.end);
		blockModalOpen = true;
	}

	function saveBlockDraft() {
		if (!draftStart || !draftEnd || !draftLabel.trim()) return;

		if (blockModalMode === `create`) {
			editableBlocks = [
				...editableBlocks,
				{
					id: draftId,
					label: draftLabel.trim(),
					start: format(draftStart, LOCAL_DATETIME),
					end: format(draftEnd, LOCAL_DATETIME),
					colour: draftColour,
					isOverride: false,
				},
			];
		}
		else {
			editableBlocks = editableBlocks.map((block) =>
				block.id === draftId ? { ...block, label: draftLabel.trim(), colour: draftColour } : block
			);
		}

		hasChanges = true;
		blockModalOpen = false;
	}

	function deleteBlockDraft() {
		editableBlocks = editableBlocks.filter((block) => block.id !== draftId);
		hasChanges = true;
		blockModalOpen = false;
	}

	function handleEventChange(info: any) {
		const { id, start, end } = info.event;
		editableBlocks = editableBlocks.map((block) =>
			block.id === id
				? { ...block, start: format(start, LOCAL_DATETIME), end: format(end, LOCAL_DATETIME) }
				: block
		);
		hasChanges = true;
	}

	function handleSelect(info: any) {
		openCreateModal(info.start, info.end);
	}

	function handleEventClick(info: any) {
		const block = editableBlocks.find((b) => b.id === info.event.id);
		if (block) openEditModal(block);
	}

	// Save-to-server modal
	let saveModalOpen = $state(false);
	let saving = $state(false);
	let saveError = $state(``);

	async function confirmSave(scopePayload: { scope: `default` } | { scope: `range`; start: string; end: string }) {
		const days = blocksToRoutineDays(editableBlocks);
		const payload: ScheduleSavePayload =
			scopePayload.scope === `default`
				? { scope: `default`, days }
				: { scope: `range`, start: scopePayload.start, end: scopePayload.end, days };

		saving = true;
		saveError = ``;
		try {
			await onSave?.(payload);
			saveModalOpen = false;
			hasChanges = false;
		}
		catch {
			saveError = `Failed to save changes.`;
		}
		finally {
			saving = false;
		}
	}

	const optionsOverride = {
		view: 'timeGridWeek',
		editable: true,
		selectable: true,
		allDaySlot: false,
		slotMinTime: '05:00:00',
		slotMaxTime: '23:00:00',
		headerToolbar: {
			start: 'title',
			center: '',
			end: 'today prev,next',
		},
		buttonText: {
			today: 'This Week',
		},
		datesSet: (info: any) => {
			const end = new SvelteDate(info.end);
			end.setDate(end.getDate() - 1);
			visibleRange = { start: info.start, end };
			onRangeChange?.(info.start, end);
		},
		select: handleSelect,
		eventClick: handleEventClick,
		eventDrop: handleEventChange,
		eventResize: handleEventChange,
	};
</script>

<!-- TODO: Allow displaying schedule by user -->

<div class="schedule_toolbar">
	{#if hasChanges}
		<span class="unsaved">Unsaved changes</span>
	{/if}
	<button disabled={!hasChanges} onclick={() => (saveModalOpen = true)}>Save changes</button>
</div>

<CalendarBase plugins={[TimeGrid, Interaction]} events={calendarEvents} {optionsOverride} />

<ScheduleBlockModal
	bind:open={blockModalOpen}
	mode={blockModalMode}
	bind:label={draftLabel}
	bind:colour={draftColour}
	{colours}
	onSave={saveBlockDraft}
	onDelete={blockModalMode === `edit` ? deleteBlockDraft : undefined}
/>

<ScheduleSaveModal
	bind:open={saveModalOpen}
	defaultStart={visibleRange ? format(visibleRange.start, `yyyy-MM-dd`) : ``}
	defaultEnd={visibleRange ? format(visibleRange.end, `yyyy-MM-dd`) : ``}
	{saving}
	error={saveError}
	onConfirm={confirmSave}
/>

<style>
	.schedule_toolbar {
		display: flex;
		align-items: center;
		gap: 1em;
		margin-bottom: 0.5em;
	}

	.unsaved {
		color: var(--orange);
	}

	:global(.schedule-override) {
		border: 2px dashed var(--white) !important;
	}
</style>
