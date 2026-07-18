<script lang="ts">
	import { format } from 'date-fns';
	import { SvelteDate } from 'svelte/reactivity';
	import { TimeGrid, Interaction } from '@event-calendar/core';
	import CalendarBase from './CalendarBase.svelte';
	import ScheduleBlockModal from './ScheduleBlockModal.svelte';
	import ScheduleSaveModal from './ScheduleSaveModal.svelte';
	import TaskEventModal from './TaskEventModal.svelte';
	import parseTasks from '$utils/calendar/parseTasks';
	import parseEvents from '$utils/calendar/parseEvents';
	import { getToken } from '$lib/auth';
	import { getGraphqlUrl } from '$utils/fetchClientData';
	import type { ScheduleBlock, ScheduleSavePayload, RoutineDays, PaletteColour } from '$types/schedule';
	import type { Task } from '$types/tasks';

	let {
		blocks = [],
		colours = [],
		tasks = [],
		events = [],
		icalEvents = [],
		readOnly = false,
		onRangeChange,
		onSave,
		onTaskCompleted,
		class: className = '',
	}: {
		blocks: ScheduleBlock[];
		colours?: PaletteColour[];
		tasks?: Task[];
		events?: any[];
		icalEvents?: any[];
		readOnly?: boolean;
		onRangeChange?: (start: Date, end: Date) => void;
		onSave?: (payload: ScheduleSavePayload) => Promise<void>;
		onTaskCompleted?: (taskId: string) => void;
		class?: string;
	} = $props();

	let selectedTask = $state<{ id: string; title: string; due?: Date; status?: string; platform: `notion` | `todoist`; link: string } | null>(null);
	let taskModalOpen = $state(false);
	let completing = $state(false);
	let completeError = $state(``);

	async function completeSelectedTask() {
		if (!selectedTask) return;
		completing = true;
		completeError = ``;

		const token = await getToken();
		const res = await fetch(getGraphqlUrl(), {
			method: `POST`,
			headers: {
				'Content-Type': `application/json`,
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
			body: JSON.stringify({
				query: `mutation { completeTask(taskId: "${selectedTask.id}", platform: ${selectedTask.platform}) { success } }`,
			}),
		}).then((r) => r.json());

		completing = false;

		if (!res?.data?.completeTask?.success) {
			completeError = `Couldn't mark this task complete. Try again.`;
			return;
		}

		onTaskCompleted?.(selectedTask.id);
		taskModalOpen = false;
	}

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

	// Every named palette colour has a guaranteed AA-contrast _text pairing
	// (see resolveTextColour in household_api) - always resolving through the
	// palette here, rather than using an arbitrary raw hex directly as the
	// background with hardcoded white text, is what makes that guarantee apply.
	function textColourFor(colour: string | null): string {
		return `var(--${resolveColourName(colour)}_text)`;
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

	let calendarEvents = $derived.by(() => {
		const blockEvents = editableBlocks.map((block) => ({
			id: block.id,
			title: block.label,
			start: new Date(block.start),
			end: new Date(block.end),
			allDay: false,
			editable: true,
			backgroundColor: block.colour ? (block.colour.startsWith('#') ? block.colour : `var(--${block.colour})`) : 'var(--purple_bright)',
			textColor: textColourFor(block.colour),
			classNames: block.isOverride ? ['schedule-override'] : [],
			extendedProps: { type: 'block', link: undefined, status: undefined, platform: undefined },
		}));

		const taskEvents = parseTasks(tasks);
		const otherEvents = [...parseEvents(events), ...parseEvents(icalEvents)];

		const readOnlyEvents = [...taskEvents, ...otherEvents].map((event) => ({
			id: event.id,
			title: event.title,
			start: new Date(event.start),
			end: new Date(event.end),
			allDay: event.allDay ?? false,
			editable: false,
			backgroundColor: 'colour' in event && event.colour ? `var(--${event.colour})` : event.type === 'task' ? 'var(--purple_bright)' : 'var(--blue)',
			textColor: 'colour' in event && event.colour ? `var(--${event.colour}_text)` : event.type === 'task' ? 'var(--purple_bright_text)' : 'var(--blue_text)',
			extendedProps: {
				type: event.type,
				link: 'link' in event ? event.link : undefined,
				status: 'status' in event ? event.status : undefined,
				platform: 'platform' in event ? event.platform : undefined,
			},
		}));

		return [...blockEvents, ...readOnlyEvents];
	});

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
		} else {
			editableBlocks = editableBlocks.map((block) => (block.id === draftId ? { ...block, label: draftLabel.trim(), colour: draftColour } : block));
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
		if (readOnly) {
			info.revert?.();
			return;
		}

		const { id, start, end } = info.event;
		editableBlocks = editableBlocks.map((block) => (block.id === id ? { ...block, start: format(start, LOCAL_DATETIME), end: format(end, LOCAL_DATETIME) } : block));
		hasChanges = true;
	}

	function handleSelect(info: any) {
		if (readOnly) return;
		openCreateModal(info.start, info.end);
	}

	function handleEventClick(info: any) {
		const { type, link, status, platform } = info.event.extendedProps ?? {};

		if (type === `task`) {
			completeError = ``;
			selectedTask = {
				id: info.event.id,
				title: info.event.title,
				due: info.event.start,
				status,
				platform,
				link,
			};
			taskModalOpen = true;
			return;
		}

		if (type === `event`) {
			if (link) window.open(link, `_blank`);
			return;
		}

		if (readOnly) return;

		const block = editableBlocks.find((b) => b.id === info.event.id);
		if (block) openEditModal(block);
	}

	// Save-to-server modal
	let saveModalOpen = $state(false);
	let saving = $state(false);
	let saveError = $state(``);

	async function confirmSave(scopePayload: { scope: `default` } | { scope: `range`; start: string; end: string }) {
		const days = blocksToRoutineDays(editableBlocks);
		const payload: ScheduleSavePayload = scopePayload.scope === `default` ? { scope: `default`, days } : { scope: `range`, start: scopePayload.start, end: scopePayload.end, days };

		saving = true;
		saveError = ``;
		try {
			await onSave?.(payload);
			saveModalOpen = false;
			hasChanges = false;
		} catch {
			saveError = `Failed to save changes.`;
		} finally {
			saving = false;
		}
	}

	// CalendarBase reads this once at mount; per-instance readOnly flips are
	// enforced by the handler guards above instead.
	// svelte-ignore state_referenced_locally
	const optionsOverride = {
		view: 'timeGridWeek',
		editable: !readOnly,
		selectable: !readOnly,
		allDaySlot: true,
		slotMinTime: '05:00:00',
		slotMaxTime: '23:00:00',
		headerToolbar: {
			start: 'title',
			center: '',
			end: 'today prev,next timeGridWeek,timeGridDay',
		},
		buttonText: {
			today: 'This Week',
			timeGridWeek: 'Week',
			timeGridDay: 'Day',
		},
		datesSet: (info: any) => {
			const end = new SvelteDate(info.end);
			end.setDate(end.getDate() - 1);
			visibleRange = { start: info.start, end };
			onRangeChange?.(info.start, end);
		},
		eventContent: (info: any) => {
			const { type } = info.event.extendedProps ?? {};
			let icon = '';
			if (type === 'task') icon = '☐ ';
			else if (type === 'event') icon = '📅 ';
			return { html: `<span>${icon}${info.event.title}</span>` };
		},
		select: handleSelect,
		eventClick: handleEventClick,
		eventDrop: handleEventChange,
		eventResize: handleEventChange,
	};
</script>

<div class="schedule_view {className}">
	<div class="schedule_toolbar">
		{#if readOnly}
			<span class="hint">Select a family member above to edit their schedule</span>
		{:else}
			{#if hasChanges}
				<span class="unsaved">Unsaved changes</span>
			{/if}
			<button
				disabled={!hasChanges}
				onclick={() => (saveModalOpen = true)}>Save changes</button
			>
		{/if}
	</div>

	<CalendarBase
		plugins={[TimeGrid, Interaction]}
		events={calendarEvents}
		{optionsOverride}
	/>

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

	{#if selectedTask}
		<TaskEventModal
			bind:open={taskModalOpen}
			title={selectedTask.title}
			due={selectedTask.due}
			status={selectedTask.status}
			platform={selectedTask.platform}
			link={selectedTask.link}
			saving={completing}
			error={completeError}
			onComplete={completeSelectedTask}
		/>
	{/if}
</div>

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

	.hint {
		color: var(--grey);
		font-style: italic;
	}
</style>
