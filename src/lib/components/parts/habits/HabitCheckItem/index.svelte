<script lang="ts">
	import { format, startOfToday } from 'date-fns';
	import { SvelteSet } from 'svelte/reactivity';
	import CheckboxButton from '$parts/CheckboxButton/index.svelte';
	import type { CheckState } from '$parts/CheckboxButton/index.svelte';
	import { DATE_FORMATS } from '$utils/dateFormats';
	import { isDayDone, isExplicitlyDone, completeHabitRequest } from '$utils/habitCompletion';
	import { formatDueDate } from '$utils/formatDueDate';
	import type { Habit } from '$types/habits';
	import styles from './index.module.css';

	let { id, name, due, recurrenceInterval, streak, completions, onComplete, class: className = '' }: Pick<Habit, 'id' | 'name' | 'due' | 'recurrenceInterval' | 'streak' | 'completions'> & { onComplete?: (id: string) => void; class?: string } = $props();

	let saving = $state(false);
	let actionError = $state('');

	// Marked the instant the checkbox is clicked, so it flips to done straight
	// away instead of waiting on the mutation + a habits refetch.
	let pendingCompletions = new SvelteSet<string>();

	// Extended_Pictographic covers emoji; ‍ (ZWJ) keeps combined sequences
	// like a family emoji together as one match instead of splitting them up.
	const EMOJI_PATTERN = /\p{Extended_Pictographic}(‍\p{Extended_Pictographic})*/gu;

	let { emoji, label } = $derived.by(() => {
		const emoji = (name.match(EMOJI_PATTERN) ?? []).join('');
		const label = name.replace(EMOJI_PATTERN, '').trim();
		return { emoji, label };
	});

	// Native title tooltips don't fire reliably on a mobile long-press, so
	// press-and-hold is handled manually alongside the CSS :hover/:focus tooltip.
	let showTooltip = $state(false);
	let pressTimer: ReturnType<typeof setTimeout> | undefined;

	function startPress() {
		pressTimer = setTimeout(() => {
			showTooltip = true;
		}, 500);
	}

	function endPress() {
		clearTimeout(pressTimer);
		showTooltip = false;
	}

	function habitState(): CheckState {
		const today = startOfToday();
		const dateKey = format(today, DATE_FORMATS.iso);
		if (pendingCompletions.has(dateKey) || isExplicitlyDone(today, completions)) return 'complete';
		if (isDayDone(today, completions, recurrenceInterval)) return 'partial';
		return 'incomplete';
	}

	async function completeHabit() {
		if (saving) return;
		saving = true;
		actionError = '';

		const dateKey = format(startOfToday(), DATE_FORMATS.iso);
		pendingCompletions.add(dateKey);

		const success = await completeHabitRequest(id);
		saving = false;

		if (!success) {
			pendingCompletions.delete(dateKey);
			actionError = "Couldn't mark this habit complete. Try again.";
			return;
		}

		onComplete?.(id);
	}
</script>

<div class="habit-check {className}">
	<CheckboxButton
		class="checkbox"
		state={habitState()}
		disabled={saving}
		onclick={completeHabit}
		label="Mark {name} complete"
	/>
	<span class={styles.label}>
		{#if emoji && label}
			<span
				class={styles.emoji}
				tabindex="0"
				role="button"
				aria-label={label}
				ontouchstart={startPress}
				ontouchend={endPress}
				ontouchcancel={endPress}
			>
				{emoji}
				<span
					class={[styles.tooltip, showTooltip && styles.visible]}
					role="tooltip">{label}</span
				>
			</span>
		{:else}
			{name}
		{/if}
	</span>
	{#if due}<span class={styles.due}>{formatDueDate(due)}</span>{/if}
	{#if streak > 0}
		<span class={styles.streak}>🔥 {streak} <span class="sr-only">days in a row</span></span>
	{/if}
	{#if actionError}<p class={styles.error}>{actionError}</p>{/if}
</div>
