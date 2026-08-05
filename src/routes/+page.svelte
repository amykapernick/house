<script lang="ts">
	import { isAuthenticated } from '$lib/auth';
	import { format, parseISO, startOfDay, startOfToday, endOfDay, subDays, addDays, isPast, isToday } from 'date-fns';
	import { DATE_FORMATS } from '$utils/dateFormats';
	import { SvelteMap } from 'svelte/reactivity';
	import fetchClientData, { setCache } from '$utils/fetchClientData';
	import fetchHabitsData from '$utils/habitsData';
	import { isDayDone, isExplicitlyDone } from '$utils/habitCompletion';
	import { prefetchRecipes } from '$utils/prefetchRecipes';
	import { getDashboardMealPlanRange } from '$utils/dateRanges';
	import { resolve } from '$app/paths';
	import RecipeCard from '$components/parts/recipes/RecipeCard.svelte';
	import Skeleton from '$components/parts/Skeleton.svelte';
	import EmptyState from '$components/parts/EmptyState.svelte';
	import Switch from '$parts/Switch.svelte';
	import HabitCheckItem from '$parts/habits/HabitCheckItem.svelte';
	import AllergenCheckItem from '$parts/smallHuman/AllergenCheckItem.svelte';
	import DayView from '$partials/calendar/DayView.svelte';
	import { getPageTitle } from '$utils/pageTitle';
	import { EVERYONE, isVisibleToUser, fetchCurrentUserSlug } from '$utils/fetchFamilyMembers';
	import type { Habit } from '$types/habits';
	import type { Task } from '$types/tasks';
	import type { ScheduleBlock, PaletteColour } from '$types/schedule';
	import Pill from '$components/parts/Pill.svelte';

	let meals = $state<any[]>([]);
	let loading = $state(true);

	// Starts at EVERYONE (so filtering falls through harmlessly) until the
	// current-user lookup resolves - the dashboard always shows the signed-in
	// user's own items, with no picker to switch to anyone else's.
	let currentUserSlug = $state(EVERYONE);

	let upcomingTasks = $state<Task[]>([]);
	let upcomingLoading = $state(true);

	let dayEvents = $state<any[]>([]);
	let eventsLoading = $state(true);
	let scheduleBlocks = $state<ScheduleBlock[]>([]);
	let scheduleLoading = $state(true);
	let colours = $state<PaletteColour[]>([]);
	let showSchedule = $state(true);
	// The day currently shown in the dashboard's Today/calendar widget -
	// navigating via DayView's own prev/next/today buttons reports back here
	// via onDateChange, which drives the events/schedule refetch below.
	let selectedDay = $state(startOfDay(new Date()));
	let dayLoading = $derived(upcomingLoading || eventsLoading || scheduleLoading);

	let habits = $state<Habit[]>([]);
	let habitsLoading = $state(true);

	let allergens = $state<any[]>([]);
	let allergensLoading = $state(true);

	let visibleTasks = $derived(upcomingTasks.filter((task) => isVisibleToUser(task.assigned, currentUserSlug)));
	// Notion events carry no family data and always bypass the filter, same as
	// the calendar/schedule pages - only calendar-platform events get narrowed.
	let visibleDayEvents = $derived(dayEvents.filter((event) => event.platform === `notion` || isVisibleToUser(event.family, currentUserSlug)));
	let visibleScheduleBlocks = $derived(scheduleBlocks.filter((block) => isVisibleToUser(block.family ? [block.family] : [], currentUserSlug)));
	let visibleHabits = $derived(habits.filter((habit) => isVisibleToUser(habit.assigned, currentUserSlug)));

	// Habits and allergens (also Todoist tasks under the hood, completed via
	// the same completeHabit mutation) share one "due soon" list on the
	// dashboard, so they're merged and sorted together by due date.
	type DueSoonItem = { due: string } & ({ type: 'habit'; habit: Habit & { due: string } } | { type: 'allergen'; allergen: any });

	let dueSoonItems = $derived.by(() => {
		const rangeEnd = endOfDay(addDays(new Date(), 3));

		const habitItems: DueSoonItem[] = visibleHabits.filter((habit): habit is Habit & { due: string } => !!habit.due && new Date(habit.due) <= rangeEnd).map((habit) => ({ type: 'habit', due: habit.due, habit }));

		// Every allergen shows here regardless of due date, not just those due soon.
		const allergenItems: DueSoonItem[] = allergens.filter((allergen) => !!allergen.due).map((allergen) => ({ type: 'allergen', due: allergen.due, allergen }));

		return [...habitItems, ...allergenItems].sort((a, b) => new Date(a.due).getTime() - new Date(b.due).getTime());
	});

	// Warning takes priority over the due-date categories below - a habit
	// already covered by a prior completion's recurrence window shouldn't
	// also read as overdue/due/upcoming.
	function habitPillStatus(habit: Habit & { due: string }): 'warning' | 'error' | 'info' | 'success' {
		const today = startOfToday();
		if (isDayDone(today, habit.completions, habit.recurrenceInterval) && !isExplicitlyDone(today, habit.completions)) return 'warning';

		const due = new Date(habit.due);
		if (isPast(due) && !isToday(due)) return 'error';
		if (isToday(due)) return 'info';
		return 'success';
	}

	function allergenPillStatus(allergen: { due: string }): 'error' | 'info' | 'success' {
		const due = new Date(allergen.due);
		if (isPast(due) && !isToday(due)) return 'error';
		if (isToday(due)) return 'info';
		return 'success';
	}

	// Keep the shared cache in sync so a revisit within the TTL doesn't show the pre-update streak.
	function handleHabitComplete(id: string) {
		habits = habits.map((habit) => (habit.id === id ? { ...habit, streak: habit.streak + 1, lastCompleted: new Date().toISOString() } : habit));
		setCache(`habits-${format(new Date(), DATE_FORMATS.iso)}`, { habits });
	}

	// Matches the small-human page's own completeAllergen: bumps due 7 days out
	// locally so the item drops out of the "due soon" window immediately,
	// rather than waiting on a refetch.
	function handleAllergenComplete(id: string) {
		const newDue = format(addDays(new Date(), 7), DATE_FORMATS.iso);
		allergens = allergens.map((allergen) => (allergen.id === id ? { ...allergen, due: newDue } : allergen));
	}

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
			const today = format(new Date(), DATE_FORMATS.iso);

			function handleTasks(res: any) {
				upcomingTasks = res.tasks ?? [];
				upcomingLoading = false;
			}
			fetchClientData({
				cacheKey: 'dashboard-tasks',
				onStale: handleTasks,
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
					}
				`,
			}).then(handleTasks);

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
		}
	});

	// Refetches whenever selectedDay changes (DayView's own prev/next/today
	// buttons report navigation back via onDateChange), so the calendar widget
	// shows real events/schedule data for whichever day is currently browsed.
	$effect(() => {
		if ($isAuthenticated) {
			// ±1 day around the selected day rather than exactly its start/end, so an
			// event near midnight isn't dropped by a timezone mismatch between the
			// browser and wherever Home Assistant computes its own day boundary.
			const eventsStart = startOfDay(subDays(selectedDay, 1)).toISOString();
			const eventsEnd = endOfDay(addDays(selectedDay, 1)).toISOString();
			const dayKey = format(selectedDay, DATE_FORMATS.iso);

			function handleEvents(res: any) {
				dayEvents = res.events ?? [];
				eventsLoading = false;
			}
			fetchClientData({
				cacheKey: `dashboard-events-${dayKey}`,
				onStale: handleEvents,
				gqlQuery: `
					query {
						events(start: "${eventsStart}", end: "${eventsEnd}") {
							id
							name
							dates { start end }
							status
							allDay
							colour
							family { slug }
							platform
						}
					}
				`,
			}).then(handleEvents);

			function handleSchedule(res: any) {
				scheduleBlocks = res.schedule ?? [];
				scheduleLoading = false;
			}
			fetchClientData({
				cacheKey: `schedule-${dayKey}-${dayKey}`,
				onStale: handleSchedule,
				gqlQuery: `
					query {
						schedule(from: "${dayKey}", to: "${dayKey}") {
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
			function handleAllergens(res: any) {
				allergens = res.allergens ?? [];
				allergensLoading = false;
			}
			const today = format(new Date(), DATE_FORMATS.iso);
			fetchClientData({
				cacheKey: `allergens-${today}`,
				onStale: handleAllergens,
				gqlQuery: `
					query {
						allergens(today: "${today}") {
							id name due isRecurring link urgency daysUntilDue
						}
					}
				`,
			}).then(handleAllergens);
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
			} else {
				bySlug.set(meal.recipe.slug, { recipe: meal.recipe, days: day ? [day] : [] });
			}
		}
		return [...bySlug.values()];
	});
</script>

<svelte:head>
	<title>{getPageTitle(`Dashboard`)}</title>
</svelte:head>

<h1 class="sr-only">Dashboard</h1>

{#if $isAuthenticated}
	<div class="dashboard">
		<section
			class="widget"
			data-widget="tasks"
		>
			<h2 class="sr-only">Upcoming</h2>
			<a href={resolve('/tasks')}>View Tasks</a>

			{#if upcomingLoading}
				<Skeleton rows={3} />
			{:else if upcomingItems.length === 0}
				<EmptyState title="Nothing due in the next week" />
			{:else}
				<ul class="agenda">
					{#each upcomingItems as item (item.id)}
						<li class="agenda-item">
							<span class="agenda-label">{item.label}</span>
							<span
								class="agenda-meta"
								class:overdue={item.meta === 'Overdue'}>{item.meta}</span
							>
						</li>
					{/each}
				</ul>
			{/if}
		</section>

		<section
			class="widget"
			data-widget="habits"
		>
			<h2 class="sr-only">Habits</h2>
			<a href={resolve('/habits')}>View all</a>

			{#if habitsLoading || allergensLoading}
				<Skeleton rows={3} />
			{:else if dueSoonItems.length === 0}
				<EmptyState title="Nothing due today" />
			{:else}
				<ul class="habits">
					{#each dueSoonItems as item (item.type === 'habit' ? item.habit.id : item.allergen.id)}
						<li>
							{#if item.type === 'habit'}
								<Pill
									class="habit"
									status={habitPillStatus(item.habit)}
									><HabitCheckItem
										{...item.habit}
										onComplete={handleHabitComplete}
									/></Pill
								>
							{:else}
								<Pill
									class="habit"
									status={allergenPillStatus(item.allergen)}
									><AllergenCheckItem
										{...item.allergen}
										onComplete={handleAllergenComplete}
									/></Pill
								>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}
		</section>

		<section
			class="widget"
			data-widget="calendar"
		>
			<h2 class="sr-only">Today</h2>
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

			{#if dayLoading}
				<Skeleton rows={3} />
			{:else}
				<DayView
					tasks={visibleTasks}
					events={visibleDayEvents}
					scheduleBlocks={visibleScheduleBlocks}
					{colours}
					{showSchedule}
					onDateChange={(date) => (selectedDay = startOfDay(date))}
				/>
			{/if}
		</section>

		<section
			class="widget"
			data-widget="meals"
		>
			<h2 class="sr-only">This week's meals</h2>
			<a href={resolve('/meal-plan')}>View all</a>

			{#if loading}
				<Skeleton rows={3} />
			{:else if weekRecipes.length === 0}
				<EmptyState title="No meals planned this week" />
			{:else}
				<div class="grid">
					{#each weekRecipes as { recipe, days } (recipe.slug)}
						<RecipeCard
							{recipe}
							size="compact"
							dayLabel={days.length ? days.join(', ') : undefined}
						>
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
	</div>
{:else}
	<EmptyState
		title="Sign in to continue"
		message="See your upcoming tasks and this week's meals once you're signed in."
	/>
{/if}

<style>
	@import '@mixins';

	.dashboard {
		display: grid;
		grid-gap: 1em;
		grid-template-areas: 'upcoming' 'habits' 'calendar' 'meals';
	}

	.widget {
		&[data-widget='tasks'] {
			grid-area: upcoming;
		}

		&[data-widget='calendar'] {
			grid-area: calendar;

			& :global(.calendar-container.day_view) {
				max-height: 80vh;
			}
		}

		&[data-widget='habits'] {
			grid-area: habits;
		}

		&[data-widget='meals'] {
			grid-area: meals;
		}
	}

	.schedule-toggle {
		display: flex;
		align-items: center;
		gap: 0.4em;
		font-size: 0.85em;
	}

	.agenda,
	.habits {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.habits {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5em;

		& :global(.habit) {
			position: relative;
		}

		& :global(.habit-check) {
			grid-template-areas:
				'label streak'
				'due streak';
			grid-template-columns: 1fr auto;
		}

		& :global(:is(.habit-check, .allergen-check) .checkbox) {
			position: static;
			grid-area: streak;
			width: 0.1px;
			height: 0.1px;
		}

		& :global(:is(.habit-check, .allergen-check) .checkbox svg) {
			display: none;
		}

		& :global(:is(.habit-check, .allergen-check) .checkbox::before) {
			content: '';
			position: absolute;
			inset: 0;
		}
	}

	.agenda-item {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		padding: 0.5em 0;
		border-bottom: 1px solid var(--grey_light);
		gap: 1em;

		&:last-child {
			border-bottom: none;
		}
	}

	.agenda-label {
		font-size: 0.9em;
	}

	.agenda-meta {
		flex-shrink: 0;
		color: var(--grey);
		font-size: 0.8em;

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
			color: var(--blue);
			font-size: 0.65em;
		}
	}

	@media (width >= 40em) {
		.dashboard {
			grid-template-areas: 'upcoming calendar' 'habits calendar' 'meals calendar';
			grid-template-columns: 1fr auto;
			grid-template-rows: auto auto 1fr;
			gap: 2em;
		}

		.widget {
			&[data-widget='calendar'] {
				min-width: 20em;
			}
		}
	}

	@media (width >= 65em) {
		.dashboard {
			grid-template-areas: 'upcoming habits calendar' 'meals meals calendar';
			grid-template-columns: 1fr 1fr auto;
			grid-template-rows: auto 1fr;
		}

		.widget {
			&[data-widget='calendar'] {
				min-width: 30em;
			}
		}
	}
</style>
