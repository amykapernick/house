<script lang="ts">
	import type { Vaccinations } from '$types/smallHuman';
	import Card from '$parts/Card/index.svelte';
	import Icon from '$parts/Icon/index.svelte';
	import Pill from '$parts/Pill/index.svelte';
	import styles from './index.module.css';

	const {
		vaccinations,
		class: className = '',
	}: {
		vaccinations: Vaccinations;
		class?: string;
	} = $props();
</script>

<div class={className}>
	<p>{vaccinations.note}</p>
	<div class={styles.vaccinations}>
		{#each vaccinations.items as v (v.id)}
			<Card>
				<h3>{v.title}</h3>
				<!-- TODO: Add due or given date -->
				<Icon
					colour={true}
					name={v.todoist_task ? 'calendar' : 'vaccine'}
				/>
				<p class={styles.detail}>{v.detail}</p>
				<!-- TODO: Allow changing status of vaccination with statusselect component -->
				<Pill
					status={v.status}
					class="status">{v.status}</Pill
				>
			</Card>
		{/each}
	</div>
</div>
