<script lang="ts">
	import type { MilestoneStatus, MilestoneCategory } from '$types/generated';
	import Pill from '../Pill.svelte';
	import Card from './Card.svelte';
	import StatusSelect from './StatusSelect.svelte';

	const {
		id,
		title,
		status,
		note,
		detail,
		expected_months,
		type,
		onStatusChange,
		class: className = '',
	}: {
		id: string;
		title: string;
		status: MilestoneStatus;
		note?: string | null;
		detail?: string;
		expected_months?: number[];
		type?: MilestoneCategory;
		onStatusChange?: (id: string, status: MilestoneStatus) => void;
		class?: string;
	} = $props();

	const statusLabel: Record<MilestoneStatus, string> = {
		done: 'Done',
		in_progress: 'In Progress',
		watch: 'Watch',
		upcoming: 'Upcoming',
	};

	const categoryLabel: Record<MilestoneCategory, string> = {
		movement: 'Movement',
		fine_motor: 'Fine Motor',
		development: 'Development',
	};
</script>

<Card
	{title}
	class={className}
>
	<div class="content">
		{#if expected_months}
			<p class="range">{expected_months.map((m) => Math.round(m)).join(' - ')} months</p>
		{/if}
		{#if detail && status !== 'done'}
			<p class="detail">{detail}</p>
		{/if}
		{#if note}
			<p class="note">{note}</p>
		{/if}

		{#if onStatusChange}
			<StatusSelect
				{id}
				{status}
				labels={statusLabel}
				onChange={onStatusChange}
				class="status"
			/>
		{:else}
			<Pill
				class="status"
				{status}>{statusLabel[status]}</Pill
			>
		{/if}
		{#if type}
			<span class="category">{categoryLabel[type]}</span>
		{/if}
	</div>
</Card>

<style>
	@import '@mixins';

	.content {
		display: grid;
		grid-template-areas: 'range range range' 'detail detail detail' 'note note note' 'tags . status';
		grid-template-columns: auto 1fr auto;
		grid-template-rows: auto auto 1fr auto;
		height: 100%;
		column-gap: 1em;

		& :global(.status) {
			grid-area: status;
			align-self: center;
			margin: 0;
		}
	}

	.range {
		grid-area: range;
		margin: 0;
		color: var(--purple_bright);
		font-size: 0.8em;
		font-weight: 600;
	}

	.detail {
		grid-area: detail;
		margin: 0 0 0.7em;
		font-size: 0.9em;
	}

	.note {
		grid-area: note;
	}

	.category {
		@include subtitle;

		grid-area: tags;
		align-self: center;
	}
</style>
