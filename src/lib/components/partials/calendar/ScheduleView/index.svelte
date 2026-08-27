<script lang="ts">
	import { format } from 'date-fns';
	import { DATE_FORMATS } from '$utils/dateFormats';
	import { SvelteDate } from 'svelte/reactivity';
	import CalendarBase from '../CalendarBase/index.svelte';
	import EventContent from './EventContent.svelte';
	import ScheduleBlockModal from '../ScheduleBlockModal/index.svelte';
	import ScheduleSaveModal from '../ScheduleSaveModal/index.svelte';
	import TaskEventModal from '../TaskEventModal/index.svelte';
	import parseTasks from '$utils/calendar/parseTasks';
	import parseEvents from '$utils/calendar/parseEvents';
	import { completeTask } from '$utils/completeTask';
	import type { ScheduleBlock, ScheduleSavePayload, RoutineDays, PaletteColour } from '$types/schedule';
	import type { Task } from '$types/tasks';
	import type { CalendarInstanceApi } from '@svar-ui/svelte-calendar';
	import styles from './index.module.css';

	let {
		blocks = [],
		colours = [],
		tasks = [],
		events = [],
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

		const result = await completeTask(selectedTask.id, selectedTask.platform);

		completing = false;

		if (result.queued) {
			completeError = `Offline - will complete when back online`;
			return;
		}

		if (!result.success) {
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
		const otherEvents = parseEvents(events);

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

	// A move sends both start and end; a resize (dragging just an edge) sends
	// only whichever end changed - see @svar-ui/svelte-calendar's dragresize.js.
	function handleEventChange(id: string | number, start: Date | undefined, end: Date | undefined) {
		editableBlocks = editableBlocks.map((block) => (block.id === id ? { ...block, start: start ? format(start, LOCAL_DATETIME) : block.start, end: end ? format(end, LOCAL_DATETIME) : block.end } : block));
		hasChanges = true;
	}

	function handleSelect(start: Date, end: Date) {
		if (readOnly) return;
		openCreateModal(start, end);
	}

	function handleEventClick(event: { id: string | number; text?: string; start: Date; extendedProps?: Record<string, unknown> }) {
		const { type, link, status, platform } = (event.extendedProps ?? {}) as { type?: string; link?: string; status?: unknown; platform?: `notion` | `todoist` };

		if (type === `task`) {
			completeError = ``;
			selectedTask = {
				id: String(event.id),
				title: event.text ?? '',
				due: event.start,
				status: status as string,
				platform: platform as `notion` | `todoist`,
				link: link as string,
			};
			taskModalOpen = true;
			return;
		}

		if (type === `event`) {
			if (link) window.open(link, `_blank`);
			return;
		}

		if (readOnly) return;

		const block = editableBlocks.find((b) => b.id === event.id);
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
	// enforced by the handler guards/init closures below instead, which read
	// the live prop rather than this frozen snapshot.
	// svelte-ignore state_referenced_locally
	const optionsOverride = {
		view: 'week',
		readonly: readOnly,
		eventContent: EventContent,
		init: (api: CalendarInstanceApi) => {
			// Drag-to-create/move/resize all route through add-event/update-event
			// (see @svar-ui/svelte-calendar's drag directive) - intercepting lets
			// this app's own editableBlocks stay the single source of truth
			// instead of @svar-ui/calendar-store's internal event store, and
			// vetoing add-event always (rather than only when readOnly) keeps a
			// stray unlabeled block from appearing before the create modal is
			// even filled in.
			api.intercept('add-event', (rawAction) => {
				const { event } = rawAction as { event: { start?: Date; end?: Date } };
				if (event.start && event.end) handleSelect(event.start, event.end);
				return false;
			});
			api.intercept('update-event', (rawAction) => {
				if (readOnly) return false;
				const { id, event } = rawAction as { id: string | number; event: { start?: Date; end?: Date } };
				if (event.start || event.end) handleEventChange(id, event.start, event.end);
			});
			api.intercept('select-event', (rawAction) => {
				const { id } = rawAction as { id: string | number | null };
				if (id == null) return false;
				const event = api.getEvent(id);
				if (event) handleEventClick(event as { id: string | number; text?: string; start: Date; extendedProps?: Record<string, unknown> });
				return false;
			});
			api.getReactiveState().visibleDateRange.subscribe((range) => {
				const end = new SvelteDate(range.end);
				end.setDate(end.getDate() - 1);
				visibleRange = { start: range.start, end };
				onRangeChange?.(range.start, end);
			});
		},
	};
</script>

<div class="schedule_view {className}">
	<div class={styles.schedule_toolbar}>
		{#if readOnly}
			<span class={styles.hint}>Select a family member above to edit their schedule</span>
		{:else}
			{#if hasChanges}
				<span class={styles.unsaved}>Unsaved changes</span>
			{/if}
			<button
				disabled={!hasChanges}
				onclick={() => (saveModalOpen = true)}>Save changes</button
			>
		{/if}
	</div>

	<CalendarBase
		events={calendarEvents}
		views={['week', 'day']}
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
		defaultStart={visibleRange ? format(visibleRange.start, DATE_FORMATS.iso) : ``}
		defaultEnd={visibleRange ? format(visibleRange.end, DATE_FORMATS.iso) : ``}
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
