<script lang="ts">
	import { dndzone } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';
	import { intervalToDuration } from 'date-fns';
	import {
		MEAL_PLANNING_DND_TYPE,
		MEAL_PLANNING_FLIP_MS,
		resolveDroppedItem,
		type PlanningDndItem,
	} from '$utils/mealPlanningDnd';

	let {
		date,
		label,
		displayDate,
		isToday,
		items = $bindable(),
	}: {
		date: string;
		label: string;
		displayDate: string;
		isToday: boolean;
		items: PlanningDndItem[];
	} = $props();

	function formatMinutes(mins: string | null): string {
		if (!mins) return '';
		const m = parseInt(mins, 10);
		if (isNaN(m) || m <= 0) return '';
		const { hours, minutes } = intervalToDuration({ start: 0, end: m * 60 * 1000 });
		if (hours && minutes) return `${hours}h ${minutes}m`;
		if (hours) return `${hours}h`;
		return `${minutes}m`;
	}

	function handleConsider(e: CustomEvent<{ items: PlanningDndItem[] }>) {
		items = e.detail.items;
	}

	function handleFinalize(e: CustomEvent<{ items: PlanningDndItem[] }>) {
		items = e.detail.items.map((item) => resolveDroppedItem(item, date));
	}

	function removeDraft(id: string) {
		items = items.filter((item) => item.id !== id);
	}
</script>

<div class="day" class:today={isToday}>
	<h2>
		{label}
		<span class="date">{displayDate}</span>
	</h2>

	<div
		class="entries"
		aria-label="{label} {displayDate} meals"
		use:dndzone={{ items, type: MEAL_PLANNING_DND_TYPE, flipDurationMs: MEAL_PLANNING_FLIP_MS, delayTouchStart: true }}
		onconsider={handleConsider}
		onfinalize={handleFinalize}
	>
		{#if items.length === 0}
			<p class="empty">Drop a recipe here</p>
		{/if}
		{#each items as item (item.id)}
			<div class="meal" class:draft={item.kind === `draft`} animate:flip={{ duration: MEAL_PLANNING_FLIP_MS }}>
				<div class="meal-header">
					<span class="meal-type">{item.entryType}</span>
					{#if item.kind === `draft`}
						<span class="new-badge">New</span>
						<button type="button" class="remove-btn" onclick={() => removeDraft(item.id)} aria-label="Remove {item.recipe.name}">
							×
						</button>
					{/if}
				</div>
				{#if item.recipe}
					<span class="recipe-name">{item.recipe.name}</span>
					{#if item.recipe.totalTime || item.recipe.servings}
						<span class="recipe-meta">
							{#if item.recipe.totalTime}{formatMinutes(item.recipe.totalTime)}{/if}
							{#if item.recipe.servings} · {item.recipe.servings} servings{/if}
						</span>
					{/if}
				{:else if item.kind === `existing` && item.title}
					<span class="recipe-name">{item.title}</span>
					{#if item.text}<p class="meal-text">{item.text}</p>{/if}
				{/if}
			</div>
		{/each}
	</div>
</div>

<style>
	@import '@mixins';

	.day {
		border: 1px solid var(--grey_light);
		border-radius: 0.3em;
		padding: 0.8em;
		min-height: 150px;

		&.today {
			border-color: var(--purple_bright);
			background: color-mix(in srgb, var(--purple_bright) 4%, transparent);
		}

		& h2 {
			font-size: 0.85em;
			margin: 0 0 0.5em;
			display: flex;
			flex-direction: column;
		}
	}

	.date {
		font-size: 0.85em;
		font-weight: 400;
		color: var(--grey);
	}

	.entries {
		min-height: 60px;
	}

	.empty {
		font-size: 0.8em;
		color: var(--grey);
		font-style: italic;
	}

	.meal {
		margin-bottom: 0.5em;
		padding: 0.4em;
		background: color-mix(in srgb, var(--blue) 6%, transparent);
		border-radius: 0.3em;
		cursor: grab;

		&.draft {
			border: 1px dashed var(--purple_bright);
		}
	}

	.meal-header {
		display: flex;
		align-items: center;
		gap: 0.4em;
	}

	.meal-type {
		font-size: 0.65em;
		text-transform: uppercase;
		font-weight: 600;
		color: var(--grey);
	}

	.new-badge {
		font-size: 0.6em;
		text-transform: uppercase;
		font-weight: 600;
		color: var(--purple_bright);
	}

	.remove-btn {
		margin-left: auto;
		border: none;
		background: none;
		color: var(--grey);
		cursor: pointer;
		font-size: 0.9em;
		line-height: 1;
		padding: 0;

		&:hover {
			color: var(--red);
		}
	}

	.recipe-name {
		display: block;
		font-size: 0.85em;
		font-weight: 600;
		line-height: 1.2;
	}

	.recipe-meta {
		display: block;
		font-size: 0.7em;
		color: var(--grey);
	}

	.meal-text {
		font-size: 0.8em;
		color: var(--grey);
		margin: 0.2em 0 0;
	}
</style>
