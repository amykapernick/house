<script lang="ts">
	import { format, startOfToday } from 'date-fns';
	import { SvelteSet } from 'svelte/reactivity';
	import CheckboxButton from '$parts/CheckboxButton.svelte';
	import type { CheckState } from '$parts/CheckboxButton.svelte';
	import { DATE_FORMATS } from '$utils/dateFormats';
	import { isDayDone, isExplicitlyDone, completeHabitRequest } from '$utils/habitCompletion';
	import { formatDueDate } from '$utils/formatDueDate';
	import type { Habit } from '$types/habits';

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
	<span class="label">
		{#if emoji && label}
			<span
				class="emoji"
				tabindex="0"
				role="button"
				aria-label={label}
				ontouchstart={startPress}
				ontouchend={endPress}
				ontouchcancel={endPress}
			>
				{emoji}
				<span
					class="tooltip"
					class:visible={showTooltip}
					role="tooltip">{label}</span
				>
			</span>
		{:else}
			{name}
		{/if}
	</span>
	{#if due}<span class="due">{formatDueDate(due)}</span>{/if}
	{#if streak > 0}
		<span class="streak">🔥 {streak} <span class="sr-only">days in a row</span></span>
	{/if}
	{#if actionError}<p class="error">{actionError}</p>{/if}
</div>

<style>
	.habit-check {
		display: grid;
		grid-template-areas:
			'checkbox label streak'
			'checkbox due streak';
		grid-template-columns: auto 1fr auto;
		grid-template-rows: auto 1fr;
		gap: 0.2ch 0.5ch;
		width: auto;

		& :global(button::before) {
			content: '';
			display: block;
			position: absolute;
			inset: 0 4em 0 2em;
		}

		& :global(.checkbox) {
			grid-area: checkbox;
		}
	}

	.label {
		display: flex;
		grid-area: label;
		flex: 1;
		flex-wrap: wrap;
		align-items: baseline;
		font-weight: 600;
		word-wrap: break-word;
		word-break: break-word;
		white-space: wrap;
		gap: 0 1ch;
	}

	.due {
		grid-area: due;
		color: var(--purple_solid_flat);
		font-size: 0.8em;
		font-weight: 400;
	}

	.streak {
		grid-area: streak;
		align-self: center;
	}

	.emoji {
		position: relative;
		cursor: default;
		-webkit-touch-callout: none;
		user-select: none;
	}

	/* TODO: Use new css anchoring */
	.tooltip {
		position: absolute;
		z-index: 1;
		bottom: 100%;
		left: 50%;
		padding: 0.2em 0.6em;
		transform: translateX(-50%);
		transition: opacity 0.15s ease;
		border-radius: 0.2em;
		opacity: 0;
		background: var(--black);
		color: var(--white);
		font-size: 0.75em;
		font-weight: 400;
		white-space: nowrap;
		pointer-events: none;
	}

	.emoji:hover .tooltip,
	.emoji:focus .tooltip,
	.tooltip.visible {
		opacity: 1;
	}

	.streak {
		grid-area: streak;
		font-size: 0.9em;
	}

	.error {
		position: absolute;
		top: 100%;
		left: 0;
		grid-column: 1 / -1;
		margin: 0;
		color: var(--red);
		font-size: 0.8em;
		white-space: nowrap;
	}
</style>
