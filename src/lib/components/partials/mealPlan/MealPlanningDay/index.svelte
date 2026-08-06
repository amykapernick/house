<script lang="ts">
	import { dndzone } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';
	import { format } from 'date-fns';
	import { MEAL_PLANNING_DND_TYPE, MEAL_PLANNING_FLIP_MS, resolveDroppedItem, type PlanningDndItem, type ExistingDndItem } from '$utils/mealPlanningDnd';
	import { formatMinutes } from '$utils/formatMinutes';
	import styles from './index.module.css';

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

<div class={[styles.day, className, isToday && styles.today]}>
	<h2>
		{label}
		<span class={styles.date}>{displayDate}</span>
	</h2>

	<div
		class={styles.entries}
		aria-label="{label} {displayDate} meals"
		use:dndzone={{ items, type: MEAL_PLANNING_DND_TYPE, flipDurationMs: MEAL_PLANNING_FLIP_MS, delayTouchStart: true }}
		onconsider={handleConsider}
		onfinalize={handleFinalize}
	>
		{#if items.length === 0}
			<p class={styles.empty}>Drop a recipe here</p>
		{/if}
		{#each items as item (item.id)}
			<div
				class={[styles.meal, item.kind === `draft` && styles.draft]}
				animate:flip={{ duration: MEAL_PLANNING_FLIP_MS }}
			>
				<div class={styles['meal-header']}>
					<span class={styles['meal-type']}>{item.entryType}</span>
					{#if item.kind === `draft`}
						<span class={styles['new-badge']}>New</span>
						<button
							type="button"
							class={styles['remove-btn']}
							onclick={() => removeDraft(item.id)}
							aria-label="Remove {item.recipe.name}"
						>
							×
						</button>
					{:else}
						<button
							type="button"
							class={styles['edit-btn']}
							onclick={() => onEditItem?.(item)}
							aria-label="Edit meal">✎</button
						>
					{/if}
				</div>
				{#if item.recipe}
					<!-- TODO: Show relevant freezer items on recipes, including serves, eg. Marinated Chicken *2, Shepherds Pie *4 -->
					<span class={styles['recipe-name']}>{item.recipe.name}</span>
					{#if item.recipe.totalTime || item.recipe.servings}
						<span class={styles['recipe-meta']}>
							{#if item.recipe.totalTime}{formatMinutes(item.recipe.totalTime)}{/if}
							{#if item.recipe.servings}
								· {item.recipe.servings} servings{/if}
						</span>
					{/if}
				{:else if item.kind === `existing` && item.title}
					<span class={styles['recipe-name']}>{item.title}</span>
					{#if item.text}<p class={styles['meal-text']}>{item.text}</p>{/if}
				{/if}
			</div>
		{/each}
	</div>

	<button
		type="button"
		class={styles['add-meal']}
		onclick={() => onAddMeal?.()}>+ Add meal</button
	>

	{#if eveningEvents.length}
		<ul class={styles['evening-events']}>
			{#each eveningEvents as event (event.id)}
				<li>
					<span class={styles['event-title']}>{event.title}</span>
					<span class={styles['event-time']}>{format(event.start, `h:mma`)}–{format(event.end, `h:mma`)}</span>
				</li>
			{/each}
		</ul>
	{/if}
</div>
