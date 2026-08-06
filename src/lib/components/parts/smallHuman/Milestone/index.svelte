<script lang="ts">
	import type { MilestoneStatus, MilestoneCategory } from '$types/generated';
	import Pill from '../../Pill/index.svelte';
	import Card from '../Card/index.svelte';
	import StatusSelect from '../StatusSelect/index.svelte';
	import styles from './index.module.css';

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
	<div class={styles.content}>
		{#if expected_months}
			<p class={styles.range}>{expected_months.map((m) => Math.round(m)).join(' - ')} months</p>
		{/if}
		{#if detail && status !== 'done'}
			<p class={styles.detail}>{detail}</p>
		{/if}
		{#if note}
			<p class={styles.note}>{note}</p>
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
			<span class={styles.category}>{categoryLabel[type]}</span>
		{/if}
	</div>
</Card>
