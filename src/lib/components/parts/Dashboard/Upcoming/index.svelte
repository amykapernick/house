<script lang="ts">
	import { resolve } from '$app/paths';
	import Skeleton from '$parts/Skeleton/index.svelte';
	import EmptyState from '$parts/EmptyState/index.svelte';
	import Pill from '$parts/Pill/index.svelte';
	import Panel from '$parts/Dashboard/Panel/index.svelte';
	import styles from './index.module.css';

	let {
		items,
		loading,
		class: className = '',
	}: {
		items: { id: string; label: string; date: Date; meta: string }[];
		loading: boolean;
		class?: string;
	} = $props();
</script>

<Panel
	title="Upcoming"
	class={className}
>
	{#snippet actions()}
		<a
			class={styles.link}
			href={resolve('/tasks')}>View Tasks</a
		>
	{/snippet}

	<div class={styles['agenda-container']}>
		{#if loading}
			<Skeleton rows={3} />
		{:else if items.length === 0}
			<EmptyState title="Nothing due in the next week" />
		{:else}
			<ul class={styles.agenda}>
				{#each items as item (item.id)}
					<li class={styles['agenda-item']}>
						<span class={styles['agenda-label']}>{item.label}</span>
						{#if item.meta === 'Overdue'}
							<Pill
								class={styles['overdue-pill']}
								status="error">{item.meta}</Pill
							>
						{:else}
							<span class={styles['agenda-meta']}>{item.meta}</span>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</Panel>
