<script lang="ts">
	import { onMount } from 'svelte';
	import BudgetView from '$partials/finance/BudgetView/index.svelte';
	import EmptyState from '$parts/EmptyState/index.svelte';
	import type { BudgetItem } from '$types/budget';
	import type { BudgetBucket } from '$types/budgetBucket';
	import type { BudgetSpendEntry } from '$types/budgetSpend';
	import {
		cloneBuckets,
		cloneBudget,
		createScenario,
		getScenarios,
		nextScenarioName,
		saveScenarios,
		type BudgetScenario,
	} from '$utils/budgetScenarios';
	import styles from './index.module.css';

	let {
		budget,
		buckets,
		entries = [],
	}: {
		// The real (server) budget - new scenarios start as a copy of it.
		budget: BudgetItem[];
		buckets: BudgetBucket[];
		entries?: BudgetSpendEntry[];
	} = $props();

	let scenarios = $state<BudgetScenario[]>([]);
	let activeId = $state<string | null>(null);
	let loaded = $state(false);

	// Loaded client-side only, since localStorage isn't available during SSR.
	onMount(() => {
		scenarios = getScenarios();
		activeId = scenarios[0]?.id ?? null;
		loaded = true;
	});

	// Every edit is written straight back to localStorage - there's no save step,
	// scenarios are scratch workings. $state.snapshot reads the whole tree, so
	// this reruns on any nested change (item amounts, bucket percentages, names).
	$effect(() => {
		const snapshot = $state.snapshot(scenarios);
		if (loaded) saveScenarios(snapshot);
	});

	let activeIndex = $derived(scenarios.findIndex((s) => s.id === activeId));

	function touch() {
		if (activeIndex >= 0) scenarios[activeIndex].updatedAt = Date.now();
	}

	function addScenario() {
		const scenario = createScenario(nextScenarioName(scenarios), budget, buckets);
		scenarios.push(scenario);
		activeId = scenario.id;
	}

	function duplicateScenario(source: BudgetScenario) {
		const scenario = createScenario(`${source.name} (copy)`, source.budget, source.buckets);
		scenarios.push(scenario);
		activeId = scenario.id;
	}

	function resetScenario(scenario: BudgetScenario) {
		if (!confirm(`Reset "${scenario.name}" back to the current budget?`)) return;
		scenario.budget = cloneBudget(budget);
		scenario.buckets = cloneBuckets(buckets);
		scenario.updatedAt = Date.now();
	}

	function deleteScenario(scenario: BudgetScenario) {
		if (!confirm(`Delete "${scenario.name}"?`)) return;
		const index = scenarios.indexOf(scenario);
		scenarios = scenarios.filter((s) => s.id !== scenario.id);
		if (activeId === scenario.id) activeId = scenarios[Math.min(index, scenarios.length - 1)]?.id ?? null;
	}

	const formatUpdated = (timestamp: number) => new Date(timestamp).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' });
</script>

{#if loaded}
	{#if !scenarios.length}
		<EmptyState
			title="No scenarios yet"
			message="Scenarios start as a copy of your current budget, and can be edited freely to work out what-ifs without changing the real budget. They're saved on this device only."
		>
			<button type="button" onclick={addScenario}>+ New scenario</button>
		</EmptyState>
	{:else}
		<div class={styles.scenarios}>
			<ul class={styles.list} aria-label="Scenarios">
				{#each scenarios as scenario (scenario.id)}
					<li>
						<button
							type="button"
							aria-current={scenario.id === activeId ? 'true' : undefined}
							onclick={() => (activeId = scenario.id)}
						>
							{scenario.name || 'Untitled scenario'}
						</button>
					</li>
				{/each}
			</ul>
			<button type="button" onclick={addScenario}>+ New scenario</button>
		</div>

		{#if activeIndex >= 0}
			{@const scenario = scenarios[activeIndex]}
			<div class={styles.toolbar}>
				<label class={styles.name}>
					<span>Name</span>
					<input
						type="text"
						bind:value={scenarios[activeIndex].name}
						oninput={touch}
					/>
				</label>
				<button type="button" onclick={() => duplicateScenario(scenario)}>Duplicate</button>
				<button type="button" onclick={() => resetScenario(scenario)}>Reset to current budget</button>
				<button type="button" onclick={() => deleteScenario(scenario)}>Delete</button>
				<span class={styles.updated}>Saved locally · {formatUpdated(scenario.updatedAt)}</span>
			</div>

			<BudgetView bind:budget={scenarios[activeIndex].budget} bind:buckets={scenarios[activeIndex].buckets} {entries} editing onChange={touch} />
		{/if}
	{/if}
{/if}
