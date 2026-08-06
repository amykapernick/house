<script lang="ts">
	import { addDays, eachDayOfInterval, endOfMonth, endOfYear, format, startOfMonth, startOfWeek, startOfYear } from 'date-fns';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import HabitItem from '../HabitItem/index.svelte';
	import SegmentedToggle from '$parts/SegmentedToggle/index.svelte';
	import { EVERYONE } from '$utils/fetchFamilyMembers';
	import type { Habit, HabitViewRange } from '$types/habits';
	import type { User } from '$types/global';
	import Chevron from '$img/icons/chevron-down-fill.svg?component';
	import styles from './index.module.css';

	let { habits = [], selectedUserSlug = EVERYONE, onComplete, class: className = '' }: { habits: Habit[]; selectedUserSlug?: string; onComplete?: (id: string) => void; class?: string } = $props();

	let range = $state<HabitViewRange>('week');

	let days = $derived.by(() => {
		const now = new Date();
		if (range === 'year') return eachDayOfInterval({ start: startOfYear(now), end: endOfYear(now) });
		if (range === 'month') return eachDayOfInterval({ start: startOfMonth(now), end: endOfMonth(now) });

		const weekStart = startOfWeek(now, { weekStartsOn: 1 });
		return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
	});

	// Month/year views pack every day into one icon-per-day column instead of
	// one column per day - too many columns to read sensibly otherwise.
	let columnCount = $derived(range === 'week' ? days.length : 1);

	// A habit assigned to nobody in particular (or to someone outside the
	// family) resolves to the whole family (see resolveAssignedUsers on the
	// API) rather than a single person, so it comes back with more than one
	// assigned member - the only case a genuine single-assignee habit can't
	// produce. That's the signal used to split those into their own "Everyone"
	// section instead of duplicating them into every individual's section.
	let everyoneItems = $derived(habits.filter((habit) => habit.assigned.length > 1).sort(byDueDate));

	// Kept visible regardless of `selectedUserSlug` - an "everyone" habit is
	// still relevant on an individual's filtered view, just not as if it were
	// personally theirs.
	let sections = $derived.by(() => {
		const members = new SvelteMap<string, User>();
		habits.forEach((habit) => {
			if (habit.assigned.length > 1) return;
			habit.assigned.forEach((user) => {
				if (selectedUserSlug === EVERYONE || user.slug === selectedUserSlug) members.set(user.slug, user);
			});
		});

		return Array.from(members.values()).map((member) => ({
			member,
			items: habits.filter((habit) => habit.assigned.length === 1 && habit.assigned[0].slug === member.slug).sort(byDueDate),
		}));
	});

	// Habits without a due date sort to the end rather than the start, so an
	// empty/unparseable due date doesn't jump the queue ahead of everything
	// that actually has one.
	function byDueDate(a: Habit, b: Habit) {
		if (!a.due && !b.due) return 0;
		if (!a.due) return 1;
		if (!b.due) return -1;
		return new Date(a.due).getTime() - new Date(b.due).getTime();
	}

	// Tracks collapsed sections rather than open ones, so every section starts
	// open by default without needing to seed this from `sections` first.
	let collapsed = new SvelteSet<string>();

	function toggleSection(slug: string) {
		if (collapsed.has(slug)) collapsed.delete(slug);
		else collapsed.add(slug);
	}
</script>

<div class="{styles.habit_view} {className}">
	<SegmentedToggle
		class="switcher"
		legend="Range"
		name="habit-range"
		bind:value={range}
		options={[
			{ value: 'week', label: 'Week' },
			{ value: 'month', label: 'Month' },
			{ value: 'year', label: 'Year' },
		]}
	/>

	<div class={styles["table-scroll"]}>
		<!-- TODO: Replace table layout -->
		<table class={styles.table}>
			<thead>
				<tr>
					<th></th>
					{#if range === 'week'}
						{#each days as day (day.toISOString())}
							<th>{format(day, 'EEE d')}</th>
						{/each}
					{:else if range === 'month'}
						<th>{format(days[0], 'MMMM yyyy')}</th>
					{:else}
						<th>{format(days[0], 'yyyy')}</th>
					{/if}
				</tr>
			</thead>
			<tbody>
				{#each sections as { member, items } (member.slug)}
					<tr class={styles.member}>
						<td colspan={columnCount + 1}>
							<button
								type="button"
								class={styles.toggle}
								aria-expanded={!collapsed.has(member.slug)}
								onclick={() => toggleSection(member.slug)}
							>
								<span
									class={[styles.chevron, !collapsed.has(member.slug) && styles.open]}><Chevron /></span
								>
								{#if member.profile}
									<img
										class={styles.avatar}
										src={member.profile}
										alt=""
									/>
								{/if}
								{member.name}
							</button>
						</td>
					</tr>
					{#if !collapsed.has(member.slug)}
						{#each items as habit (habit.id)}
							<HabitItem
								{...habit}
								{days}
								{range}
								{onComplete}
							/>
						{/each}
					{/if}
				{/each}
				{#if everyoneItems.length}
					<tr class={styles.member}>
						<td colspan={columnCount + 1}>
							<button
								type="button"
								class={styles.toggle}
								aria-expanded={!collapsed.has(EVERYONE)}
								onclick={() => toggleSection(EVERYONE)}
							>
								<span
									class={[styles.chevron, !collapsed.has(EVERYONE) && styles.open]}><Chevron /></span
								>
								Everyone
							</button>
						</td>
					</tr>
					{#if !collapsed.has(EVERYONE)}
						{#each everyoneItems as habit (habit.id)}
							<HabitItem
								{...habit}
								{days}
								{range}
								{onComplete}
							/>
						{/each}
					{/if}
				{/if}
			</tbody>
		</table>
	</div>
</div>
