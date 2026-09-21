<script lang="ts">
	import { isAuthenticated } from '$lib/auth';
	import { format, parseISO, startOfDay, endOfDay, subDays, addDays } from 'date-fns';
	import { DATE_FORMATS } from '$utils/dateFormats';
	import { SvelteMap } from 'svelte/reactivity';
	import fetchClientData, { setCache } from '$utils/fetchClientData';
	import fetchHabitsData from '$utils/habitsData';
	import { prefetchRecipes } from '$utils/prefetchRecipes';
	import { getDashboardMealPlanRange } from '$utils/dateRanges';
	import EmptyState from '$parts/EmptyState/index.svelte';
	import Today from '$parts/Dashboard/Today/index.svelte';
	import Upcoming from '$parts/Dashboard/Upcoming/index.svelte';
	import Habits from '$parts/Dashboard/Habits/index.svelte';
	import Meals from '$parts/Dashboard/Meals/index.svelte';
	import type { DueSoonItem } from '$parts/Dashboard/Habits/index.svelte';
	import { getPageTitle } from '$utils/pageTitle';
	import { EVERYONE, isVisibleToUser, fetchCurrentUser } from '$utils/fetchFamilyMembers';
	import type { CurrentUser } from '$utils/fetchFamilyMembers';
	import type { Habit } from '$types/habits';
	import type { Task } from '$types/tasks';
	import type { ScheduleBlock, PaletteColour } from '$types/schedule';
	import styles from './+page.module.css';

	function greetingForHour(hour: number): string {
		if (hour < 12) return 'morning';
		if (hour < 18) return 'afternoon';
		return 'evening';
	}
	const greeting = greetingForHour(new Date().getHours());
	const todayLabel = format(new Date(), 'EEEE d MMMM');

	let meals = $state<any[]>([]);
	let loading = $state(true);

	// Starts at EVERYONE (so filtering falls through harmlessly) until the
	// current-user lookup resolves - the dashboard always shows the signed-in
	// user's own items, with no picker to switch to anyone else's.
	let currentUserSlug = $state(EVERYONE);
	// The signed-in user's family-record display name (PocketBase, via the `me`
	// query) - not Clerk's own user object, which the header/profile page also
	// bypass in favour of this same `me.name` for the same reason.
	let currentUserName = $state<string | null>(null);

	let upcomingTasks = $state<Task[]>([]);
	let upcomingLoading = $state(true);

	let dayEvents = $state<any[]>([]);
	let eventsLoading = $state(true);
	let scheduleBlocks = $state<ScheduleBlock[]>([]);
	let scheduleLoading = $state(true);
	let colours = $state<PaletteColour[]>([]);
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
	let dueSoonItems = $derived.by(() => {
		const rangeEnd = endOfDay(addDays(new Date(), 3));

		const habitItems: DueSoonItem[] = visibleHabits.filter((habit): habit is Habit & { due: string } => !!habit.due && new Date(habit.due) <= rangeEnd).map((habit) => ({ type: 'habit', due: habit.due, habit }));

		// Every allergen shows here regardless of due date, not just those due soon.
		const allergenItems: DueSoonItem[] = allergens.filter((allergen) => !!allergen.due).map((allergen) => ({ type: 'allergen', due: allergen.due, allergen }));

		return [...habitItems, ...allergenItems].sort((a, b) => new Date(a.due).getTime() - new Date(b.due).getTime());
	});

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
			function handleCurrentUser(user: CurrentUser | undefined) {
				if (user?.slug) currentUserSlug = user.slug;
				currentUserName = user?.name ?? null;
			}
			fetchCurrentUser(handleCurrentUser).then(handleCurrentUser);
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
	<div class={styles.dashboard}>
		<header class={styles.header}>
			{#if currentUserName}
				<p class={styles.greeting}>Good {greeting}, {currentUserName}</p>
				<p class={styles.date}>{todayLabel}</p>
			{/if}
		</header>

		<Today
			class={styles.today}
			tasks={visibleTasks}
			events={visibleDayEvents}
			scheduleBlocks={visibleScheduleBlocks}
			{colours}
			loading={dayLoading}
			onDateChange={(date) => (selectedDay = startOfDay(date))}
		/>

		<Upcoming
			class={styles.upcoming}
			items={upcomingItems}
			loading={upcomingLoading}
		/>

		<Habits
			class={styles.habits}
			items={dueSoonItems}
			loading={habitsLoading || allergensLoading}
			onHabitComplete={handleHabitComplete}
			onAllergenComplete={handleAllergenComplete}
		/>

		<Meals
			class={styles.meals}
			recipes={weekRecipes}
			{loading}
		/>
	</div>
{:else}
	<EmptyState
		title="Sign in to continue"
		message="See your upcoming tasks and this week's meals once you're signed in."
	/>
{/if}
