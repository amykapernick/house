<script lang="ts">
	import { addDays, eachDayOfInterval, endOfMonth, endOfYear, format, startOfMonth, startOfWeek, startOfYear } from 'date-fns';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import HabitItem from './HabitItem.svelte';
	import { EVERYONE } from '$utils/fetchFamilyMembers';
	import type { Habit, HabitViewRange } from '$types/habits';
	import type { User } from '$types/global';

	let {
		habits = [],
		selectedUserSlug = EVERYONE,
		onComplete,
	}: { habits: Habit[]; selectedUserSlug?: string; onComplete?: (id: string) => void } = $props();

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

	// A habit assigned to nobody in particular resolves to the whole family
	// (see resolveAssignedUsers on the API), so it can appear under more than
	// one member's section - that's expected, not a duplication bug. But when
	// filtered to one member, only build that member's section - otherwise an
	// "everyone" habit's full assigned list would still surface every other
	// member's (empty-looking, but really just-not-relevant) section too.
	let sections = $derived.by(() => {
		const members = new SvelteMap<string, User>();
		habits.forEach((habit) =>
			habit.assigned.forEach((user) => {
				if (selectedUserSlug === EVERYONE || user.slug === selectedUserSlug) members.set(user.slug, user);
			})
		);

		return Array.from(members.values()).map((member) => ({
			member,
			items: habits.filter((habit) => habit.assigned.some((user) => user.slug === member.slug)),
		}));
	});

	// Tracks collapsed sections rather than open ones, so every section starts
	// open by default without needing to seed this from `sections` first.
	let collapsed = new SvelteSet<string>();

	function toggleSection(slug: string) {
		if (collapsed.has(slug)) collapsed.delete(slug);
		else collapsed.add(slug);
	}
</script>

<nav class="switcher">
	<button type="button" onclick={() => (range = 'week')} data-active={range === 'week'}>Week</button>
	<button type="button" onclick={() => (range = 'month')} data-active={range === 'month'}>Month</button>
	<button type="button" onclick={() => (range = 'year')} data-active={range === 'year'}>Year</button>
</nav>

<div class="table-scroll">
	<table class="table">
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
				<tr class="member">
					<td colspan={columnCount + 1}>
						<button
							type="button"
							class="toggle"
							aria-expanded={!collapsed.has(member.slug)}
							onclick={() => toggleSection(member.slug)}
						>
							<span class="chevron" class:open={!collapsed.has(member.slug)}>▸</span>
							{#if member.profile}
								<img class="avatar" src={member.profile} alt="" />
							{/if}
							{member.name}
						</button>
					</td>
				</tr>
				{#if !collapsed.has(member.slug)}
					{#each items as habit (habit.id)}
						<HabitItem {...habit} {days} {range} {onComplete} />
					{/each}
				{/if}
			{/each}
		</tbody>
	</table>
</div>

<style>
	.switcher {
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		padding: 0.5em;
		gap: 10px;

		& button {
			&:not([data-active='true']) {
				--button_background: var(--neutral_light);
				--button_text: var(--purple_bright);
				--button_border: var(--purple_bright);
			}
		}
	}

	.table-scroll {
		overflow-x: auto;
	}

	.table {
		width: 100%;
		border-collapse: collapse;

		& th {
			padding: 0.3em 0.5em;
			font-size: 0.8em;
			font-weight: 600;
			text-align: center;
		}
	}

	.member {
		background: var(--feature_colour);
	}

	.toggle {
		display: flex;
		align-items: center;
		width: 100%;
		padding: 0.4em 0.5em;
		border: none;
		background: none;
		color: inherit;
		font: inherit;
		font-size: 1.1em;
		font-weight: 600;
		text-align: left;
		cursor: pointer;
		gap: 0.5ch;
	}

	.chevron {
		display: inline-block;
		transition: transform 0.15s ease;

		&.open {
			transform: rotate(90deg);
		}
	}

	.avatar {
		width: 1.3em;
		height: 1.3em;
		border-radius: 50%;
		object-fit: cover;
	}
</style>
