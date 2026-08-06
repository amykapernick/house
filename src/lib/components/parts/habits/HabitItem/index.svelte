<script lang="ts">
	import { add, endOfDay, format, isBefore, isToday, isTomorrow, isWithinInterval, isYesterday, startOfDay, startOfToday, subDays } from 'date-fns';
	import { SvelteSet } from 'svelte/reactivity';
	import CheckboxButton from '$parts/CheckboxButton/index.svelte';
	import type { CheckState } from '$parts/CheckboxButton/index.svelte';
	import { getToken } from '$lib/auth';
	import { getGraphqlUrl } from '$utils/fetchClientData';
	import { DATE_FORMATS } from '$utils/dateFormats';
	import type { Habit, HabitViewRange } from '$types/habits';
	import styles from './index.module.css';

	let { id, name, due, recurrenceInterval, streak, completions, days, range, onComplete, class: className = '' }: Habit & { days: Date[]; range: HabitViewRange; onComplete?: (id: string) => void; class?: string } = $props();

	let saving = $state(false);
	let actionError = $state('');

	// Todoist only gives us a time (due.datetime, ISO with a "T") when the task
	// actually has one set - a plain due.date ("2026-07-21") is date-only, so
	// don't invent a misleading "at 12:00am" for those.
	function formatDue(dueDate: string) {
		const date = new Date(dueDate);
		const time = dueDate.includes('T') ? ` at ${format(date, 'h:mmaaa')}` : '';

		if (isToday(date)) return `Today${time}`;
		if (isTomorrow(date)) return `Tomorrow${time}`;
		if (isYesterday(date)) return `Yesterday${time}`;
		return `${format(date, DATE_FORMATS.short)}${time}`;
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
		if (pendingCompletions.has(format(day, DATE_FORMATS.iso))) return true;

		return completions.some((completion) => {
			const completedAt = new Date(completion);
			const coversUntil = subDays(nextOccurrenceAfter(completedAt), 1);

			return isWithinInterval(day, { start: startOfDay(completedAt), end: endOfDay(coversUntil) });
		});
	}

	// A day is only "explicitly" done if it's the actual completion date itself,
	// as opposed to a later day just riding along in that completion's coverage
	// window (see isDayDone above) - the name checkbox distinguishes the two so
	// a habit someone hasn't touched today doesn't look fully done.
	function isExplicitlyDone(day: Date) {
		const dateKey = format(day, DATE_FORMATS.iso);
		if (pendingCompletions.has(dateKey)) return true;

		return completions.some((completion) => format(new Date(completion), DATE_FORMATS.iso) === dateKey);
	}

	function habitState(day: Date): CheckState {
		if (isExplicitlyDone(day)) return 'complete';
		if (isDayDone(day)) return 'partial';
		return 'incomplete';
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
		pressTimer = setTimeout(() => {
			showTooltip = true;
		}, 500);
	}

	function endPress() {
		clearTimeout(pressTimer);
		showTooltip = false;
	}

	async function completeHabit(completedAt?: string) {
		if (saving) return;
		saving = true;
		actionError = '';

		const dateKey = completedAt ?? format(new Date(), DATE_FORMATS.iso);
		pendingCompletions.add(dateKey);

		const token = await getToken();
		const args = completedAt ? `habitId: "${id}", completedAt: "${completedAt}"` : `habitId: "${id}"`;
		const res = await fetch(getGraphqlUrl(), {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...(token ? { Authorization: `Bearer ${token}` } : {}),
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

<tr class="{styles.habit} {className}">
	<td class={styles.name}>
		<CheckboxButton
			class="checkbox"
			state={habitState(startOfToday())}
			disabled={saving}
			onclick={() => completeHabit()}
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
			{#if due}<span class={styles.due}>{formatDue(due)}</span>{/if}
		</span>
		{#if streak > 0}
			<span class={styles.streak}>🔥 {streak} <span class="sr-only">days in a row</span></span>
		{/if}
		{#if actionError}<p class={styles.error}>{actionError}</p>{/if}
	</td>
	{#if range === 'week'}
		{#each days as day (day.toISOString())}
			<td
				class={styles.day}
				title={format(day, 'EEEE d MMM')}
			>
				{@render dayIcon(day)}
			</td>
		{/each}
	{:else}
		<td class={styles["days-column"]}>
			<ul class={styles["days-list"]}>
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
			class={styles["day-complete"]}
			disabled={saving}
			onclick={() => completeHabit(format(day, DATE_FORMATS.iso))}
		>
			<span
				aria-hidden="true"
				data-done={done}
				data-missed={missed}
				class={styles.status}
			></span>
			<span class="sr-only">Mark {name} complete for {format(day, 'EEEE d MMM')}</span>
		</button>
	{:else}
		<span
			aria-hidden="true"
			data-done={done}
			data-missed={missed}
			class={styles.status}
		></span>
		<!-- TODO: simplify this to just be one line with swithc out statement -->
		{#if done}
			<span class="sr-only">{name} completed on {format(day, 'EEEE d MMM')}</span>
		{:else if missed}
			<span class="sr-only">{name} wasn't completed on {format(day, 'EEEE d MMM')}</span>
		{:else}
			<span class="sr-only">{name} is upcoming on {format(day, 'EEEE d MMM')}</span>
		{/if}
	{/if}
{/snippet}
