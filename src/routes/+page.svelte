<script lang="ts">
	import { isAuthenticated } from '$lib/auth';
	import { format, parseISO, startOfDay, endOfDay } from 'date-fns';
	import { SvelteMap } from 'svelte/reactivity';
	import fetchClientData from '$utils/fetchClientData';
	import fetchHabitsData from '$utils/habitsData';
	import { prefetchRecipes } from '$utils/prefetchRecipes';
	import { getDashboardMealPlanRange } from '$utils/dateRanges';
	import { resolve } from '$app/paths';
	import RecipeCard from '$components/parts/recipes/RecipeCard.svelte';
	import Skeleton from '$components/parts/Skeleton.svelte';
	import EmptyState from '$components/parts/EmptyState.svelte';
	import Switch from '$parts/Switch.svelte';
	import DayView from '$partials/calendar/DayView.svelte';
	import { getPageTitle } from '$utils/pageTitle';
	import { EVERYONE, isVisibleToUser, fetchCurrentUserSlug } from '$utils/fetchFamilyMembers';
	import type { Habit } from '$types/habits';
	import type { Task } from '$types/tasks';
	import type { ScheduleBlock, PaletteColour } from '$types/schedule';

	let meals = $state<any[]>([]);
	let loading = $state(true);

	// Starts at EVERYONE (so filtering falls through harmlessly) until the
	// current-user lookup resolves - the dashboard always shows the signed-in
	// user's own items, with no picker to switch to anyone else's.
	let currentUserSlug = $state(EVERYONE);

	let upcomingTasks = $state<Task[]>([]);
	let upcomingLoading = $state(true);

	let dayEvents = $state<any[]>([]);
	let icalEvents = $state<any[]>([]);
	let scheduleBlocks = $state<ScheduleBlock[]>([]);
	let colours = $state<PaletteColour[]>([]);
	let showSchedule = $state(true);
	let dayLoading = $state(true);

	let habits = $state<Habit[]>([]);
	let habitsLoading = $state(true);

	let visibleTasks = $derived(upcomingTasks.filter((task) => isVisibleToUser(task.assigned, currentUserSlug)));
	let visibleIcalEvents = $derived(icalEvents.filter((event) => isVisibleToUser(event.family, currentUserSlug)));
	let visibleScheduleBlocks = $derived(
		scheduleBlocks.filter((block) => isVisibleToUser(block.family ? [block.family] : [], currentUserSlug))
	);
	let visibleHabits = $derived(habits.filter((habit) => isVisibleToUser(habit.assigned, currentUserSlug)));

	let dueTodayOrOverdueHabits = $derived.by(() => {
		const todayStart = startOfDay(new Date());
		const todayEnd = endOfDay(new Date());

		return visibleHabits
			.filter((habit): habit is Habit & { due: string } => !!habit.due && new Date(habit.due) <= todayEnd)
			.map((habit) => ({ id: habit.id, name: habit.name, date: new Date(habit.due), overdue: new Date(habit.due) < todayStart }))
			.sort((a, b) => a.date.getTime() - b.date.getTime());
	});

	$effect(() => {
		if ($isAuthenticated) {
			const { start, end } = getDashboardMealPlanRange();

			function handleMeals(res: any) {
				const newMeals: any[] = res.mealPlans?.items ?? [];
				meals = newMeals;
				loading = false;
				prefetchRecipes(newMeals.map((meal) => meal.recipe?.slug));
			}
			fetchClientData({
				cacheKey: 'dashboard-mealplan',
				onStale: handleMeals,
				gqlQuery: `
					query {
						mealPlans(
							perPage: 50
							startDate: "${start}"
							endDate: "${end}"
							orderBy: "date"
							orderDirection: "asc"
						) {
							items {
								id date entryType
								recipe { name slug image description totalTime servings tags { name slug } }
							}
						}
					}
				`,
			}).then(handleMeals);
		}
	});

	$effect(() => {
		if ($isAuthenticated) {
			const today = format(new Date(), 'yyyy-MM-dd');

			function handleUpcoming(res: any) {
				upcomingTasks = res.tasks ?? [];
				dayEvents = res.events ?? [];
				upcomingLoading = false;
				dayLoading = false;
			}
			fetchClientData({
				cacheKey: 'dashboard-upcoming',
				onStale: handleUpcoming,
				gqlQuery: `
					query {
						tasks {
							id
							name
							status
							due
							end
							allDay
							dueLabel(today: "${today}")
							link
							platform
							assigned {
								name
								slug
								profile
								colour
							}
						}
						events {
							id
							name
							dates { start end }
						}
					}
				`,
			}).then(handleUpcoming);

			function handleIcs(res: any) { icalEvents = res.icsEvents ?? []; }
			fetchClientData({
				cacheKey: 'icsEvents',
				onStale: handleIcs,
				gqlQuery: `
					query {
						icsEvents {
							id
							name
							dates { start end }
							status
							allDay
							colour
							family { slug }
						}
					}
				`,
			}).then(handleIcs);

			// The `colours` collection has one row per theme variant of a name
			// (base/Light/Dark) - keep only the base row per name, matching the
			// schedule page's own resolveColourName/textColourFor pairing.
			function handleColours(res: any) {
				const byName = new SvelteMap<string, PaletteColour>();
				for (const c of res.colours ?? []) {
					if (!byName.has(c.name) || !c.theme) byName.set(c.name, c);
				}
				colours = [...byName.values()];
			}
			fetchClientData({
				cacheKey: 'colours',
				onStale: handleColours,
				gqlQuery: `
					query {
						colours {
							name
							hex
							link
							theme
						}
					}
				`,
			}).then(handleColours);

			const todayStr = format(new Date(), 'yyyy-MM-dd');
			function handleSchedule(res: any) { scheduleBlocks = res.schedule ?? []; }
			fetchClientData({
				cacheKey: `schedule-${todayStr}-${todayStr}`,
				onStale: handleSchedule,
				gqlQuery: `
					query {
						schedule(from: "${todayStr}", to: "${todayStr}") {
							id
							label
							start
							end
							colour
							isOverride
							family { slug }
						}
					}
				`,
			}).then(handleSchedule);
		}
	});

	$effect(() => {
		if ($isAuthenticated) {
			function handleHabits(data: Habit[]) {
				habits = data;
				habitsLoading = false;
			}
			fetchHabitsData({ onStale: handleHabits }).then(handleHabits);
		}
	});

	$effect(() => {
		if ($isAuthenticated) {
			function handleCurrentUser(slug: string | undefined) {
				if (slug) currentUserSlug = slug;
			}
			fetchCurrentUserSlug(handleCurrentUser).then(handleCurrentUser);
		}
	});

	let upcomingItems = $derived.by(() => {
		const items: { id: string; label: string; date: Date; meta: string }[] = [];

		for (const task of upcomingTasks) {
			if (task.status === 'Done' || !task.dueLabel || !task.due) continue;
			items.push({ id: `task-${task.id}`, label: task.name, date: new Date(task.due), meta: task.dueLabel });
		}

		return items.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 6);
	});

	let weekRecipes = $derived.by(() => {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- built and discarded synchronously within this derivation, never read reactively
		const bySlug = new Map<string, { recipe: any; days: string[] }>();
		for (const meal of meals) {
			if (!meal.recipe?.slug) continue;
			const day = meal.date ? format(parseISO(meal.date), 'EEEE') : null;
			const entry = bySlug.get(meal.recipe.slug);
			if (entry) {
				if (day && !entry.days.includes(day)) entry.days.push(day);
			}
			else {
				bySlug.set(meal.recipe.slug, { recipe: meal.recipe, days: day ? [day] : [] });
			}
		}
		return [...bySlug.values()];
	});
</script>

<svelte:head>
	<title>{getPageTitle(`Dashboard`)}</title>
</svelte:head>

<h1>Dashboard</h1>

{#if $isAuthenticated}
	<section class="widget">
		<div class="widget-header">
			<h2>Upcoming</h2>
			<a href={resolve('/calendar')}>View calendar</a>
		</div>

		{#if upcomingLoading}
			<Skeleton rows={3} />
		{:else if upcomingItems.length === 0}
			<EmptyState title="Nothing due in the next week" />
		{:else}
			<ul class="agenda">
				{#each upcomingItems as item (item.id)}
					<li class="agenda-item">
						<span class="agenda-label">{item.label}</span>
						<span class="agenda-meta" class:overdue={item.meta === 'Overdue'}>{item.meta}</span>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<section class="widget">
		<div class="widget-header">
			<h2>Today</h2>
			<div class="widget-header-controls">
				<span class="schedule-toggle">
					<span>Schedule</span>
					<Switch
						name="Schedule visibility"
						value={showSchedule ? 1 : 0}
						toggleFunction={(index) => (showSchedule = index === 1)}
						options={[{ label: 'Hide schedule' }, { label: 'Show schedule' }]}
					/>
				</span>
				<a href={resolve('/calendar')}>View calendar</a>
			</div>
		</div>

		{#if dayLoading}
			<Skeleton rows={3} />
		{:else}
			<DayView tasks={visibleTasks} events={dayEvents} icalEvents={visibleIcalEvents} scheduleBlocks={visibleScheduleBlocks} {colours} {showSchedule} />
		{/if}
	</section>

	<section class="widget">
		<div class="widget-header">
			<h2>Habits</h2>
			<a href={resolve('/habits')}>View all</a>
		</div>

		{#if habitsLoading}
			<Skeleton rows={3} />
		{:else if dueTodayOrOverdueHabits.length === 0}
			<EmptyState title="No habits due today" />
		{:else}
			<ul class="agenda">
				{#each dueTodayOrOverdueHabits as habit (habit.id)}
					<li class="agenda-item">
						<span class="agenda-label">{habit.name}</span>
						<span class="agenda-meta" class:overdue={habit.overdue}>{habit.overdue ? 'Overdue' : 'Today'}</span>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<section class="widget">
		<div class="widget-header">
			<h2>This week's meals</h2>
			<a href={resolve('/meal-plan')}>View all</a>
		</div>

		{#if loading}
			<Skeleton rows={3} />
		{:else if weekRecipes.length === 0}
			<EmptyState title="No meals planned this week" />
		{:else}
			<div class="grid">
				{#each weekRecipes as { recipe, days } (recipe.slug)}
					<RecipeCard {recipe} size="compact" dayLabel={days.length ? days.join(', ') : undefined}>
						{#snippet tags(recipeTags)}
							<ul class="tags">
								{#each recipeTags as tag (tag.slug)}
									<li>{tag.name}</li>
								{/each}
							</ul>
						{/snippet}
					</RecipeCard>
				{/each}
			</div>
		{/if}
	</section>
{:else}
	<EmptyState title="Sign in to continue" message="See your upcoming tasks and this week's meals once you're signed in." />
{/if}

<style>
	@import '@mixins';

	.widget {
		margin-bottom: 2em;
	}

	.widget-header {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: baseline;
		gap: 0.5em 1em;
		margin-bottom: 0.5em;

		& h2 {
			font-size: 1.1em;
			margin: 0;
		}

		& a {
			font-size: 0.85em;
			color: var(--purple_bright);
			text-decoration: none;

			&:hover {
				text-decoration: underline;
			}
		}
	}

	.widget-header-controls {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 1em;
	}

	.schedule-toggle {
		display: flex;
		align-items: center;
		gap: 0.4em;
		font-size: 0.85em;
	}

	.agenda {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.agenda-item {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 1em;
		padding: 0.5em 0;
		border-bottom: 1px solid var(--grey_light);

		&:last-child {
			border-bottom: none;
		}
	}

	.agenda-label {
		font-size: 0.9em;
	}

	.agenda-meta {
		flex-shrink: 0;
		font-size: 0.8em;
		color: var(--grey);

		&.overdue {
			color: var(--red);
			font-weight: 600;
		}
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 1em;
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 3px;
		margin: 0;
		padding: 0;
		list-style: none;

		& li {
			padding: 0.1em 0.3em;
			border: 1px solid currentColor;
			border-radius: 0.2em;
			font-size: 0.65em;
			color: var(--blue);
		}
	}
</style>
