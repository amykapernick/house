<script lang="ts">
	import Modal from '$parts/Modal/index.svelte';
	import type { ModalAction } from '$parts/Modal/index.svelte';
	import Select from '$parts/Select/index.svelte';
	import { ENTRY_TYPE_OPTIONS } from '$components/partials/mealPlan/MealPlanEntryModal/index.svelte';
	import styles from './index.module.css';

	let {
		open = $bindable(false),
		recipeName,
		date = $bindable(``),
		entryType = $bindable(`dinner`),
		saving = false,
		error = ``,
		onSave,
	}: {
		open?: boolean;
		recipeName: string;
		date?: string;
		entryType?: string;
		saving?: boolean;
		error?: string;
		onSave: () => void;
	} = $props();

	let valid = $derived(date.trim().length > 0);

	let modalActions: ModalAction[] = $derived([
		{ label: `Cancel`, onclick: () => (open = false), style: `secondary`, variant: `danger`, disabled: saving },
		{ label: saving ? `Adding…` : `Add to meal plan`, onclick: onSave, variant: `success`, disabled: !valid || saving },
	]);
</script>

<Modal bind:open title="Add to meal plan" actions={modalActions}>
	<p class={styles.recipe}>{recipeName}</p>

	<div class={styles.field}>
		<label for="add-to-meal-plan-date">Date</label>
		<input type="date" id="add-to-meal-plan-date" bind:value={date} disabled={saving} />
	</div>

	<div class={styles.field}>
		Meal type
		<Select id="add-to-meal-plan-type" label="Meal type" bind:value={entryType} options={ENTRY_TYPE_OPTIONS} />
	</div>

	{#if error}<p class={styles.error}>{error}</p>{/if}
</Modal>
