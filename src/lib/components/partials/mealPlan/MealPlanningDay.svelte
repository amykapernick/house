<script lang="ts">
	import { dndzone } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';
	import { format } from 'date-fns';
	import { MEAL_PLANNING_DND_TYPE, MEAL_PLANNING_FLIP_MS, resolveDroppedItem, type PlanningDndItem, type ExistingDndItem } from '$utils/mealPlanningDnd';
	import { formatMinutes } from '$utils/formatMinutes';

	let {
		date,
		label,
		displayDate,
		isToday,
		eveningEvents = [],
		items = $bindable(),
		onAddMeal,
		onEditItem,
		class: className = '',
	}: {
		date: string;
		label: string;
		displayDate: string;
		isToday: boolean;
		eveningEvents?: { id: string; title: string; start: Date; end: Date }[];
		items: PlanningDndItem[];
		onAddMeal?: () => void;
		onEditItem?: (item: ExistingDndItem) => void;
		class?: string;
	} = $props();

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

<div
	class="day {className}"
	class:today={isToday}
>
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
			<div
				class="meal"
				class:draft={item.kind === `draft`}
				animate:flip={{ duration: MEAL_PLANNING_FLIP_MS }}
			>
				<div class="meal-header">
					<span class="meal-type">{item.entryType}</span>
					{#if item.kind === `draft`}
						<span class="new-badge">New</span>
						<button
							type="button"
							class="remove-btn"
							onclick={() => removeDraft(item.id)}
							aria-label="Remove {item.recipe.name}"
						>
							×
						</button>
					{:else}
						<button
							type="button"
							class="edit-btn"
							onclick={() => onEditItem?.(item)}
							aria-label="Edit meal">✎</button
						>
					{/if}
				</div>
				{#if item.recipe}
					<span class="recipe-name">{item.recipe.name}</span>
					{#if item.recipe.totalTime || item.recipe.servings}
						<span class="recipe-meta">
							{#if item.recipe.totalTime}{formatMinutes(item.recipe.totalTime)}{/if}
							{#if item.recipe.servings}
								· {item.recipe.servings} servings{/if}
						</span>
					{/if}
				{:else if item.kind === `existing` && item.title}
					<span class="recipe-name">{item.title}</span>
					{#if item.text}<p class="meal-text">{item.text}</p>{/if}
				{/if}
			</div>
		{/each}
	</div>

	<button
		type="button"
		class="add-meal"
		onclick={() => onAddMeal?.()}>+ Add meal</button
	>

	{#if eveningEvents.length}
		<ul class="evening-events">
			{#each eveningEvents as event (event.id)}
				<li>
					<span class="event-title">{event.title}</span>
					<span class="event-time">{format(event.start, `h:mma`)}–{format(event.end, `h:mma`)}</span>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	@import '@mixins';

	.day {
		min-height: 150px;
		padding: 0.8em;
		border: 1px solid var(--grey_light);
		border-radius: 0.3em;

		&.today {
			border-color: var(--purple_bright);
			background: var(--purple_bright_tint_bg);
		}

		& h2 {
			display: flex;
			flex-direction: column;
			margin: 0 0 0.5em;
			font-size: 0.85em;
		}
	}

	.date {
		color: var(--grey);
		font-size: 0.85em;
		font-weight: 400;
	}

	.entries {
		min-height: 60px;
	}

	.empty {
		color: var(--grey);
		font-size: 0.8em;
		font-style: italic;
	}

	.meal {
		margin-bottom: 0.5em;
		padding: 0.4em;
		border-radius: 0.3em;
		background: color-mix(in oklch, var(--blue) 6%, var(--transparent));
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
		color: var(--grey);
		font-size: 0.65em;
		font-weight: 600;
		text-transform: uppercase;
	}

	.new-badge {
		color: var(--purple_bright);
		font-size: 0.6em;
		font-weight: 600;
		text-transform: uppercase;
	}

	.edit-btn {
		flex-shrink: 0;
		margin-left: auto;
		padding: 0;
		border: none;
		background: none;
		color: var(--grey);
		font-size: 0.75em;
		line-height: 1;
		cursor: pointer;

		&:hover {
			color: var(--purple_bright);
		}
	}

	.add-meal {
		width: 100%;
		margin-top: 0.3em;
		padding: 0.4em;
		border: 1px dashed var(--grey_light);
		border-radius: 0.3em;
		background: var(--transparent);
		color: var(--grey);
		font-size: 0.75em;
		cursor: pointer;

		&:hover {
			border-color: var(--purple_bright);
			color: var(--purple_bright);
		}
	}

	.remove-btn {
		margin-left: auto;
		padding: 0;
		border: none;
		background: none;
		color: var(--grey);
		font-size: 0.9em;
		line-height: 1;
		cursor: pointer;

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
		color: var(--grey);
		font-size: 0.7em;
	}

	.meal-text {
		margin: 0.2em 0 0;
		color: var(--grey);
		font-size: 0.8em;
	}

	.evening-events {
		margin: 0.6em 0 0;
		padding: 0.5em 0 0;
		border-top: 1px dashed var(--grey_light);
		font-size: 0.75em;
		list-style: none;

		& li {
			display: flex;
			justify-content: space-between;
			gap: 0.5em;
			margin-bottom: 0.2em;
		}
	}

	.event-title {
		color: var(--navy);
	}

	.event-time {
		flex-shrink: 0;
		color: var(--grey);
	}
</style>
