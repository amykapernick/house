<script lang="ts">
	import { add, endOfDay, format, isBefore, isToday, isTomorrow, isWithinInterval, isYesterday, startOfDay, startOfToday, subDays } from 'date-fns';
	import { getToken } from '$lib/auth';
	import { getGraphqlUrl } from '$utils/fetchClientData';
	import type { Habit } from '$types/habits';

	let {
		id,
		name,
		due,
		recurrenceInterval,
		streak,
		completions,
		days,
		onComplete,
	}: Habit & { days: Date[]; onComplete?: (id: string) => void } = $props();

	let saving = $state(false);
	let actionError = $state('');

	function formatDue(dueDate: string) {
		const date = new Date(dueDate);
		const time = format(date, 'h:mmaaa');

		if (isToday(date)) return `Today at ${time}`;
		if (isTomorrow(date)) return `Tomorrow at ${time}`;
		if (isYesterday(date)) return `Yesterday at ${time}`;
		return `${format(date, 'dd MMM')} at ${time}`;
	}

	// When the next occurrence is due, per this habit's actual Todoist
	// recurrence (e.g. "every 6 weeks") - falls back to a day later when the
	// recurrence string couldn't be parsed (e.g. "every monday").
	function nextOccurrenceAfter(date: Date) {
		if (!recurrenceInterval) return add(date, { days: 1 });

		const { count, unit } = recurrenceInterval;
		if (unit === 'day') return add(date, { days: count });
		if (unit === 'week') return add(date, { weeks: count });
		if (unit === 'month') return add(date, { months: count });
		return add(date, { years: count });
	}

	// A completion covers every day up to (not including) when the next
	// occurrence is due, so the grid doesn't falsely show gaps between
	// completions on their actual cadence.
	function isDayDone(day: Date) {
		return completions.some((completion) => {
			const completedAt = new Date(completion);
			const coversUntil = subDays(nextOccurrenceAfter(completedAt), 1);

			return isWithinInterval(day, { start: startOfDay(completedAt), end: endOfDay(coversUntil) });
		});
	}

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
		pressTimer = setTimeout(() => { showTooltip = true; }, 500);
	}

	function endPress() {
		clearTimeout(pressTimer);
		showTooltip = false;
	}

	async function completeHabit() {
		if (saving) return;
		saving = true;
		actionError = '';

		const token = await getToken();
		const res = await fetch(getGraphqlUrl(), {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...(token ? { 'Authorization': `Bearer ${token}` } : {}),
			},
			body: JSON.stringify({ query: `mutation { completeHabit(habitId: "${id}") { success } }` }),
		}).then((r) => r.json());

		saving = false;

		if (!res?.data?.completeHabit?.success) {
			actionError = "Couldn't mark this habit complete. Try again.";
			return;
		}

		onComplete?.(id);
	}
</script>

<tr class="habit">
	<td class="name">
		<button
			type="button"
			class="checkbox"
			disabled={saving}
			onclick={completeHabit}
			aria-label="Mark {name} complete"
		>
			○
		</button>
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
					<span class="tooltip" class:visible={showTooltip} role="tooltip">{label}</span>
				</span>
			{:else}
				{name}
			{/if}
			{#if due}<span class="due">{formatDue(due)}</span>{/if}
			<span class="todoist-id">#{id}</span>
		</span>
		{#if streak > 0}
			<span class="streak">🔥 {streak}</span>
		{/if}
		{#if actionError}<p class="error">{actionError}</p>{/if}
	</td>
	{#each days as day (day.toISOString())}
		{@const done = isDayDone(day)}
		{@const missed = !done && isBefore(day, startOfToday())}
		<td class="day" title={format(day, 'EEEE d MMM')}>
			{#if done}
				<span class="sr-only">{name} completed on {format(day, 'EEEE d MMM')}</span>
				<span aria-hidden="true">🟩</span>
			{:else if missed}
				<span class="sr-only">{name} wasn't completed on {format(day, 'EEEE d MMM')}</span>
				<span aria-hidden="true">🟥</span>
			{/if}
		</td>
	{/each}
</tr>

<style>
	.name {
		display: flex;
		position: relative;
		align-items: center;
		padding: 0.3em 0.5em;
		gap: 0.5ch;
	}

	.checkbox {
		padding: 0;
		border: none;
		background: none;
		font: inherit;
		font-size: 1.2em;
		color: var(--grey);
		cursor: pointer;

		&:disabled {
			cursor: default;
		}
	}

	.label {
		display: flex;
		flex: 1;
		flex-wrap: wrap;
		align-items: baseline;
		font-weight: 600;
		gap: 0 1ch;
		word-wrap: break-word;
		word-break: break-word;
		white-space: wrap;
	}

	.due {
		color: var(--grey);
		font-size: 0.8em;
		font-weight: 400;
	}

	.todoist-id {
		color: var(--grey_light);
		font-size: 0.75em;
		font-weight: 400;
		font-family: monospace;
	}

	.emoji {
		position: relative;
		cursor: default;
		-webkit-touch-callout: none;
		-webkit-user-select: none;
		user-select: none;
	}

	.tooltip {
		position: absolute;
		bottom: 100%;
		left: 50%;
		z-index: 1;
		padding: 0.2em 0.6em;
		transform: translateX(-50%);
		transition: opacity 0.15s ease;
		white-space: nowrap;
		border-radius: 0.2em;
		background: var(--black);
		color: var(--white);
		font-size: 0.75em;
		font-weight: 400;
		opacity: 0;
		pointer-events: none;
	}

	.emoji:hover .tooltip,
	.emoji:focus .tooltip,
	.tooltip.visible {
		opacity: 1;
	}

	.streak {
		font-size: 0.9em;
	}

	.day {
		width: 2.5em;
		border-left: 1px solid var(--grey_light);
		text-align: center;
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
