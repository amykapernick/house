<script lang="ts">
	import type { MilestoneStatus, MilestoneCategory } from "$types/generated";
	import Card from "../Card.svelte";
	import StatusSelect from "./StatusSelect.svelte";

	const {
		id,
		title,
		status,
		note,
		detail,
		expected_weeks,
		type,
		onStatusChange,
	}: {
		id: string;
		title: string;
		status: MilestoneStatus;
		note?: string | null;
		detail?: string;
		expected_weeks?: number[];
		type?: MilestoneCategory;
		onStatusChange?: (id: string, status: MilestoneStatus) => void;
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

	const calculatedAge = $derived(expected_weeks?.map(week => Math.round(week / 4)));
</script>

<Card
	{title}
	footer={type && categoryLabel[type]}
	icon={onStatusChange ? undefined : status}
	IconComponent={onStatusChange ? StatusSelect : undefined}
	iconProps={onStatusChange ? { id, status, labels: statusLabel, onChange: onStatusChange } : undefined}
>
	{#if detail && status !== 'done'}
		<p>{detail}</p>
	{/if}
	{#if note}
		<p>{note}</p>
	{/if}
	{#if calculatedAge}
		<p>{calculatedAge.join(' - ')} months</p>
	{/if}
	{#if !onStatusChange}
		<span class="sr-only">{statusLabel[status]}</span>
	{/if}
</Card>
