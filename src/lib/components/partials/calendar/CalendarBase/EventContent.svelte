<script lang="ts">
	import formatEventTimeRange from '$utils/calendar/formatEventTimeRange';
	import type { Task } from '$types/tasks';
	import NotionIcon from '$img/icons/notion.svg?component';
	import TodoistIcon from '$img/icons/todoist.svg?component';

	// eventContent is a component reference SVAR mounts itself (passing only
	// {event, mode}) - it can't be handed extra props per-caller the way
	// @event-calendar/core's eventContent(info) callback could close over
	// caller-local state, so the platform icon map lives here directly rather
	// than being threaded in from +page.svelte.
	const platformIcons: Partial<Record<Task['platform'], typeof NotionIcon>> = { notion: NotionIcon, todoist: TodoistIcon };

	let {
		event,
	}: {
		event: { start: Date; end: Date; allDay?: boolean; text?: string; extendedProps?: Record<string, unknown> };
	} = $props();

	let extendedProps = $derived((event.extendedProps ?? {}) as { type?: string; link?: string; platform?: Task['platform'] });
	let timeLabel = $derived(event.allDay ? '' : formatEventTimeRange(event.start, event.end));
	let PlatformIcon = $derived(extendedProps.platform ? platformIcons[extendedProps.platform] : undefined);
</script>

<span class="event_content {extendedProps.type ?? ''}">
	{#if timeLabel}<span class="event_time">{timeLabel}</span>{/if}
	{#if extendedProps.type === 'meal'}🍽{/if}
	{event.text}
	{#if extendedProps.type === 'task' && extendedProps.link && PlatformIcon}
		<!-- eslint-disable svelte/no-navigation-without-resolve -- link is the external Notion/Todoist task page, not an internal route -->
		<a
			class="platform"
			href={extendedProps.link}
			target="_blank"
			rel="noreferrer"
			onclick={(e) => e.stopPropagation()}
		>
			<span class="sr-only">Open in {extendedProps.platform}</span>
			<PlatformIcon />
		</a>
		<!-- eslint-enable svelte/no-navigation-without-resolve -->
	{/if}
</span>
