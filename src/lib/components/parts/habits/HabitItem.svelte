<script lang="ts">
	import { add, endOfDay, format, isBefore, isToday, isTomorrow, isWithinInterval, isYesterday, startOfDay, startOfToday, subDays } from 'date-fns';
	import { SvelteSet } from 'svelte/reactivity';
	import CheckboxButton from '$parts/CheckboxButton.svelte';
	import { getToken } from '$lib/auth';
	import { getGraphqlUrl } from '$utils/fetchClientData';
	import type { Habit, HabitViewRange } from '$types/habits';

	let {
		id,
		name,
		due,
		recurrenceInterval,
		streak,
		completions,
		days,
		range,
		onComplete,
		class: className = '',
	}: Habit & { days: Date[]; range: HabitViewRange; onComplete?: (id: string) => void; class?: string } = $props();

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

	// Marked the instant a day's complete button is clicked, so the square
	// flips to done straight away instead of waiting on the mutation + a
	// habits refetch. Only cleared on failure - a confirmed completion stays
	// shown as done even before `completions` itself catches up.
	let pendingCompletions = new SvelteSet<string>();

	// A completion covers every day up to (not including) when the next
	// occurrence is due, so the grid doesn't falsely show gaps between
	// completions on their actual cadence.
	function isDayDone(day: Date) {
		if (pendingCompletions.has(format(day, 'yyyy-MM-dd'))) return true;

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

	async function completeHabit(completedAt?: string) {
		if (saving) return;
		saving = true;
		actionError = '';

		const dateKey = completedAt ?? format(new Date(), 'yyyy-MM-dd');
		pendingCompletions.add(dateKey);

		const token = await getToken();
		const args = completedAt ? `habitId: "${id}", completedAt: "${completedAt}"` : `habitId: "${id}"`;
		const res = await fetch(getGraphqlUrl(), {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...(token ? { 'Authorization': `Bearer ${token}` } : {}),
			},
			body: JSON.stringify({ query: `mutation { completeHabit(${args}) { success } }` }),
		}).then((r) => r.json());

		saving = false;

		if (!res?.data?.completeHabit?.success) {
			pendingCompletions.delete(dateKey);
			actionError = "Couldn't mark this habit complete. Try again.";
			return;
		}

		onComplete?.(id);
	}

	// Matches the API's own backdate limit (completeHabit rejects anything
	// older) - only today's and the last 2 days' squares get a complete button.
	function isBackdateable(day: Date) {
		return isWithinInterval(day, { start: subDays(startOfToday(), 2), end: startOfToday() });
	}
</script>

<tr class="habit {className}">
	<td class="name">
		<CheckboxButton class="checkbox" disabled={saving} onclick={() => completeHabit()} label="Mark {name} complete" />
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
		</span>
		{#if streak > 0}
			<span class="streak">🔥 {streak}</span>
		{/if}
		{#if actionError}<p class="error">{actionError}</p>{/if}
	</td>
	{#if range === 'week'}
		{#each days as day (day.toISOString())}
			<td class="day" title={format(day, 'EEEE d MMM')}>
				{@render dayIcon(day)}
			</td>
		{/each}
	{:else}
		<td class="days-column">
			<ul class="days-list">
				{#each days as day (day.toISOString())}
					<li title={format(day, 'EEEE d MMM')}>
						{@render dayIcon(day)}
					</li>
				{/each}
			</ul>
		</td>
	{/if}
</tr>

{#snippet dayIcon(day: Date)}
	{@const done = isDayDone(day)}
	{@const missed = !done && isBefore(day, startOfToday())}
	{#if !done && isBackdateable(day)}
		<button
			type="button"
			class="day-complete"
			disabled={saving}
			onclick={() => completeHabit(format(day, 'yyyy-MM-dd'))}
			aria-label="Mark {name} complete for {format(day, 'EEEE d MMM')}"
		>
			<span aria-hidden="true">{missed ? '🟥' : '⬜'}</span>
		</button>
	{:else if done}
		<span class="sr-only">{name} completed on {format(day, 'EEEE d MMM')}</span>
		<span aria-hidden="true">🟩</span>
	{:else if missed}
		<span class="sr-only">{name} wasn't completed on {format(day, 'EEEE d MMM')}</span>
		<span aria-hidden="true">🟥</span>
	{:else}
		<span class="sr-only">{name} is upcoming on {format(day, 'EEEE d MMM')}</span>
		<span aria-hidden="true">⬜</span>
	{/if}
{/snippet}

<style>
	.name {
		display: flex;
		position: relative;
		align-items: center;
		padding: 0.3em 0.5em;
		gap: 0.5ch;
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

	.day-complete {
		padding: 0;
		border: none;
		background: none;
		font: inherit;
		font-size: 1em;
		line-height: 1;
		cursor: pointer;

		&:hover:not(:disabled),
		&:focus-visible {
			border-radius: 0.2em;
			outline: 2px solid var(--purple_bright);
			outline-offset: 2px;
		}

		&:disabled {
			cursor: wait;
		}
	}

	.days-column {
		border-left: 1px solid var(--grey_light);
	}

	.days-list {
		display: flex;
		flex-wrap: wrap;
		margin: 0;
		padding: 0.3em 0.5em;
		list-style: none;
		gap: 0.15em;

		& li {
			font-size: 0.9em;
		}
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
