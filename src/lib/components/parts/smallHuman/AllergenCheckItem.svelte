<script lang="ts">
	import type { Component } from 'svelte';
	import CheckboxButton from '$parts/CheckboxButton.svelte';
	import type { CheckState } from '$parts/CheckboxButton.svelte';
	import { completeHabitRequest } from '$utils/habitCompletion';
	import { formatDueDate } from '$utils/formatDueDate';
	import Wheat from '$img/smallHuman/grain.svg?component';
	import Cow from '$img/smallHuman/cow-2.svg?component';
	import Sesame from '$img/smallHuman/sesame.svg?component';
	import Prawn from '$img/smallHuman/shrimp.svg?component';
	import Fish from '$img/smallHuman/fish-2.svg?component';
	import Egg from '$img/smallHuman/fried-egg.svg?component';
	import Peanut from '$img/smallHuman/peanut.svg?component';
	import SoySauce from '$img/smallHuman/soy-sauce.svg?component';

	let { id, name, due, onComplete, class: className = '' }: { id: string; name: string; due?: string | null; onComplete?: (id: string) => void; class?: string } = $props();

	// Same icon set as Allergens.svelte on the small-human page, keyed by allergen name.
	const ICONS: Record<string, Component> = {
		Gluten: Wheat,
		Dairy: Cow,
		Sesame,
		Shellfish: Prawn,
		Fish,
		Egg,
		Nuts: Peanut,
		Soy: SoySauce,
	};
	let Icon = $derived(ICONS[name]);

	let saving = $state(false);
	let actionError = $state('');
	// Marked the instant the checkbox is clicked, so it flips to done straight
	// away instead of waiting on the mutation + an allergens refetch.
	let done = $state(false);

	// Allergens are completed the same way as any other habit - completeHabit
	// (not a dedicated mutation) is what drives this allergen's streak on the
	// habits page (also merged in from Todoist).
	async function completeAllergen() {
		if (saving) return;
		saving = true;
		actionError = '';
		done = true;

		const success = await completeHabitRequest(id);
		saving = false;

		if (!success) {
			done = false;
			actionError = "Couldn't mark this given. Try again.";
			return;
		}

		onComplete?.(id);
	}
</script>

<div class="allergen-check {className}">
	<CheckboxButton
		class="checkbox"
		state={(done ? 'complete' : 'incomplete') as CheckState}
		disabled={saving}
		onclick={completeAllergen}
		label="Mark {name} given"
	/>
	<span class="label">
		{#if Icon}<Icon
				class="icon"
				aria-hidden="true"
			/>{/if}
		{name}
	</span>
	{#if due}<span class="due">{formatDueDate(due)}</span>{/if}
	{#if actionError}<p class="error">{actionError}</p>{/if}
</div>

<style>
	.allergen-check {
		display: grid;
		position: relative;
		grid-template-areas:
			'checkbox label'
			'checkbox due';
		grid-template-columns: auto 1fr;
		gap: 0.2ch 0.5ch;

		& :global(.checkbox) {
			grid-area: checkbox;
		}
	}

	.label {
		display: flex;
		grid-area: label;
		align-items: baseline;
		font-weight: 600;
		gap: 0.4ch;

		& :global(.icon) {
			width: 1em;
			height: 1em;
		}
	}

	.due {
		grid-area: due;
		color: var(--purple_solid_flat);
		font-size: 0.8em;
		font-weight: 400;
	}

	.error {
		position: absolute;
		top: 100%;
		left: 0;
		margin: 0;
		color: var(--red);
		font-size: 0.8em;
		white-space: nowrap;
	}
</style>
