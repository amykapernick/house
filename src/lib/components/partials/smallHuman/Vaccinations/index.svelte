<script lang="ts">
	import type { Vaccinations, VaccinationStatus } from '$types/smallHuman';
	import Card from '$parts/Card/index.svelte';
	import Icon from '$parts/Icon/index.svelte';
	import Pill from '$parts/Pill/index.svelte';
	import StatusSelect from '$parts/smallHuman/StatusSelect/index.svelte';
	import styles from './index.module.css';

	const {
		vaccinations,
		onStatusChange,
		class: className = '',
	}: {
		vaccinations: Vaccinations;
		onStatusChange?: (id: string, status: VaccinationStatus) => void;
		class?: string;
	} = $props();

	const statusLabel: Record<VaccinationStatus, string> = {
		done: 'Done',
		watch: 'Watch',
		upcoming: 'Upcoming',
	};

	// Done vaccinations sink to the bottom - a repeating one (e.g. the annual flu
	// shot) can be flipped back to upcoming via the status select once its next
	// due date comes around, rather than staying marked done forever.
	const sortedItems = $derived(
		[...vaccinations.items].sort((a, b) => {
			if (a.status === 'done' && b.status !== 'done') return 1;
			if (a.status !== 'done' && b.status === 'done') return -1;
			return 0;
		}),
	);
</script>

<div class={className}>
	<p>{vaccinations.note}</p>
	<div class={styles.vaccinations}>
		{#each sortedItems as v (v.id)}
			<Card class={styles.card}>
				<h3>{v.title}</h3>
				<!-- TODO: Add due or given date -->
				<Icon
					class={styles.icon}
					colour={true}
					name={v.todoist_task ? 'calendar' : 'vaccine'}
				/>
				<p class={styles.detail}>{v.detail}</p>
				{#if onStatusChange}
					<StatusSelect
						id={v.id}
						status={v.status}
						labels={statusLabel}
						onChange={onStatusChange}
						class={styles.status}
					/>
				{:else}
					<Pill
						status={v.status}
						class="status">{statusLabel[v.status]}</Pill
					>
				{/if}
			</Card>
		{/each}
	</div>
</div>
