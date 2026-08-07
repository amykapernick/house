<script lang="ts">
	import { format, isSameDay, subDays } from 'date-fns';
	import Modal from '$parts/Modal/index.svelte';
	import type { ModalAction } from '$parts/Modal/index.svelte';
	import { DATE_FORMATS } from '$utils/dateFormats';
	import styles from './index.module.css';

	let {
		open = $bindable(false),
		title,
		start,
		end,
		link,
		class: className = '',
	}: {
		open?: boolean;
		title: string;
		start: Date;
		end: Date;
		link?: string;
		class?: string;
	} = $props();

	// end is exclusive (see parseEvents.ts) - step back a day so a multi-day
	// range displays its actual last day, not the day after it.
	let displayEnd = $derived(isSameDay(start, end) ? null : subDays(end, 1));
	let dateLabel = $derived(displayEnd ? `${format(start, DATE_FORMATS.full)} – ${format(displayEnd, DATE_FORMATS.full)}` : format(start, DATE_FORMATS.full));

	let modalActions: ModalAction[] = $derived([{ label: `Close`, onclick: () => (open = false), style: `secondary` }]);
</script>

<Modal bind:open class={className} {title} actions={modalActions}>
	<p class={styles.date_label}>{dateLabel}</p>

	{#if link}
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- link is an external Notion/calendar page, not an internal route -->
		<a class={styles.external} href={link} target="_blank" rel="noreferrer">Open link</a>
	{/if}
</Modal>
