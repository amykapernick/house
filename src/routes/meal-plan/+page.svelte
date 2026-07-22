<script lang="ts">
	import { isAuthenticated, getToken } from '$lib/auth';
	import fetchClientData, { getGraphqlUrl } from '$utils/fetchClientData';
	import { prefetchRecipes } from '$utils/prefetchRecipes';
	import { getWeekRange, getPlanningRange, getNextSaturday } from '$utils/dateRanges';
	import { getCurrentNoongarSeason } from '$utils/noongarSeason';
	import { buildMealPlanSaveOps, type PlanningDay, type PlanningDndItem, type PlanningRecipe } from '$utils/mealPlanningDnd';
	import { beforeNavigate } from '$app/navigation';
	import { format, parseISO, isToday, isYesterday } from 'date-fns';
	import { DATE_FORMATS } from '$utils/dateFormats';
	import { SvelteMap } from 'svelte/reactivity';
	import parseEvents from '$utils/calendar/parseEvents';
	import MealPlanEntryModal from '$lib/components/partials/mealPlan/MealPlanEntryModal.svelte';
	import MealPlanningPalette from '$lib/components/partials/mealPlan/MealPlanningPalette.svelte';
	import MealPlanningDay from '$lib/components/partials/mealPlan/MealPlanningDay.svelte';
	import DayColumn from '$lib/components/partials/mealPlan/DayColumn.svelte';
	import { getPageTitle } from '$utils/pageTitle';
	import Skeleton from '$parts/Skeleton.svelte';

	let days = $state<any[]>([]);
	let loading = $state(true);
	let weekOffset = $state(0);

	// Evening (5pm-11pm) calendar events, shown under each day so meal
	// planning accounts for what's already on that evening. `events`/`icsEvents`
	// don't take date-range args server-side, so - matching the schedule and
	// calendar pages - they're fetched once, unfiltered, and reuse the same
	// `calendar`/`icsEvents` cache keys those pages already populate.
	let calendarEvents = $state<any[]>([]);
	let icalEvents = $state<any[]>([]);

	function fetchCalendarEvents() {
		function handleCalendar(res: any) {
			calendarEvents = res.events ?? [];
		}
		fetchClientData({
			cacheKey: `calendar`,
			onStale: handleCalendar,
			gqlQuery: `
				query {
					tasks {
						id
						name
						assigned { name slug profile colour }
						status
						due
						end
						allDay
						estimate
						link
						platform
					}
					events {
						name
						dates { start end }
						status
						id
					}
				}
			`,
		}).then(handleCalendar);

		function handleIcs(res: any) {
			icalEvents = res.icsEvents ?? [];
		}
		fetchClientData({
			cacheKey: `icsEvents`,
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
	}

	$effect(() => {
		if ($isAuthenticated) {
			fetchCalendarEvents();
		}
	});

	// Same-day events whose start time falls in [17:00, 23:00), keyed by
	// "yyyy-MM-dd". Filtering on the computed start hour (rather than the
	// `allDay` flag) also naturally excludes genuinely all-day/date-only
	// events, which parse to midnight.
	let eveningEventsByDate = $derived.by(() => {
		const parsed = [...parseEvents(calendarEvents), ...parseEvents(icalEvents)];
		const map = new SvelteMap<string, typeof parsed>();

		for (const event of parsed) {
			const hour = event.start.getHours();
			if (hour < 17 || hour >= 23) continue;
			const dateKey = format(event.start, DATE_FORMATS.iso);
			if (!map.has(dateKey)) map.set(dateKey, []);
			map.get(dateKey)!.push(event);
		}

		for (const list of map.values()) list.sort((a, b) => a.start.getTime() - b.start.getTime());

		return map;
	});

	let addingToShoppingList = $state(false);
	let addToShoppingListMessage = $state(``);

	// Meal planning mode
	let planningMode = $state(false);
	let planningWeeks = $state(1);
	let seasonRecipes = $state<PlanningRecipe[]>([]);
	let seasonRecipesLoading = $state(true);
	let currentSeason = $derived(getCurrentNoongarSeason());
	let planningBoard = $state<PlanningDay[]>([]);
	let planningSaving = $state(false);
	let planningSaveError = $state(``);
	let meatReminderMessage = $state(``);
	let dirty = $derived(
		planningBoard.some((day) => day.items.some((item) => item.kind === `draft` || item.date !== item.originalDate))
	);

	function currentRange() {
		return planningMode ? getPlanningRange(planningWeeks) : getWeekRange(weekOffset);
	}

	function fetchMealPlan(skipCache = false) {
		loading = true;
		const range = currentRange();

		function handleMealPlan(res: any) {
			const newDays: any[] = res.mealPlanByDay ?? [];
			days = newDays;
			loading = false;
			prefetchRecipes(newDays.flatMap((day) => day.entries.map((entry: any) => entry.recipe?.slug)));
		}

		fetchClientData({
			cacheKey: `mealplan-${range.start}-${range.end}`,
			skipCache,
			onStale: handleMealPlan,
			gqlQuery: `
				query {
					mealPlanByDay(startDate: "${range.start}", endDate: "${range.end}") {
						date
						entries {
							id date entryType title text
							recipe {
								id name slug image
								totalTime servings
								tags { name slug }
							}
						}
					}
				}
			`,
		}).then(handleMealPlan);
	}

	$effect(() => {
		if ($isAuthenticated) {
			fetchMealPlan();
		}
	});

	async function fetchSeasonRecipes() {
		seasonRecipesLoading = true;
		const tagsRes = await fetchClientData({
			cacheKey: `recipe-tags`,
			gqlQuery: `query { recipeTags { name slug } }`,
		});
		const tag = (tagsRes.recipeTags ?? []).find(
			(t: any) => t.name.toLowerCase() === currentSeason.toLowerCase()
		);
		if (!tag) {
			seasonRecipes = [];
			seasonRecipesLoading = false;
			return;
		}
		const res = await fetchClientData({
			cacheKey: `season-recipes-${tag.slug}`,
			gqlQuery: `
				query {
					recipes(perPage: 200, tags: ["${tag.slug}"]) {
						items { id name slug image totalTime servings }
					}
				}
			`,
		});
		seasonRecipes = res.recipes?.items ?? [];
		seasonRecipesLoading = false;
	}

	function startPlanningMode() {
		planningMode = true;
		addToShoppingListMessage = ``;
		meatReminderMessage = ``;
		fetchSeasonRecipes();
		fetchMealPlan(true);
	}

	function selectPlanningWeeks(weeks: number) {
		if (weeks === planningWeeks) return;
		if (dirty && !confirm(`Discard unsaved meal plan changes?`)) return;
		planningWeeks = weeks;
		addToShoppingListMessage = ``;
		meatReminderMessage = ``;
		fetchMealPlan(true);
	}

	function exitPlanningMode() {
		if (dirty && !confirm(`Discard unsaved meal plan changes?`)) return;
		planningMode = false;
		planningBoard = [];
		planningSaveError = ``;
		fetchMealPlan(true);
	}

	// Rebuilds the working copy from server truth whenever `days` refreshes
	// while in planning mode - this is what clears all drafts/moves after a
	// successful save (fetchMealPlan(true) -> days updates -> board rebuilt).
	$effect(() => {
		if (!planningMode) return;
		planningBoard = displayDays.map((day) => ({
			date: day.date,
			items: day.entries.map((entry: any): PlanningDndItem => ({
				id: entry.id,
				kind: `existing`,
				date: day.date,
				originalDate: day.date,
				entryType: entry.entryType,
				title: entry.title ?? null,
				text: entry.text ?? null,
				recipe: entry.recipe ?? null,
			})),
		}));
	});

	async function handleSaveMealPlan() {
		const ops = buildMealPlanSaveOps(planningBoard);
		if (!ops.length) return;

		planningSaving = true;
		planningSaveError = ``;
		meatReminderMessage = ``;

		const mutation = ops
			.map((op, i) => {
				if (op.type === `create`) {
					return `op${i}: createMealPlanEntry(date: ${gqlStr(op.date)}, entryType: ${gqlStr(op.entryType)}, recipeId: ${gqlStr(op.recipeId)}) { id }`;
				}
				const parts = [`date: ${gqlStr(op.date)}`, `entryType: ${gqlStr(op.entryType)}`];
				if (op.recipeId) parts.push(`recipeId: ${gqlStr(op.recipeId)}`);
				else {
					parts.push(`title: ${gqlStr(op.title ?? ``)}`);
					if (op.text) parts.push(`text: ${gqlStr(op.text)}`);
				}
				return `op${i}: updateMealPlanEntry(id: ${gqlStr(op.id)}, ${parts.join(`, `)}) { id }`;
			})
			.join(`\n`);

		const res = await postMutation(`mutation {\n${mutation}\n}`);
		planningSaving = false;

		if (res?.errors) {
			planningSaveError = `Failed to save meal plan.`;
			return;
		}

		fetchMealPlan(true);

		const range = currentRange();
		const reminderRes = await postMutation(`
			mutation {
				createMealPlanMeatReminders(startDate: ${gqlStr(range.start)}, endDate: ${gqlStr(range.end)}) {
					success
					days { date }
				}
			}
		`);
		const reminderDays = reminderRes?.data?.createMealPlanMeatReminders?.days ?? [];
		if (reminderDays.length) {
			meatReminderMessage = `Added ${reminderDays.length} meat reminder${reminderDays.length > 1 ? `s` : ``} to Todoist.`;
		}
	}

	beforeNavigate(({ cancel }) => {
		if (planningMode && dirty && !confirm(`Discard unsaved meal plan changes?`)) cancel();
	});

	$effect(() => {
		if (!(planningMode && dirty)) return;

		function handler(e: BeforeUnloadEvent) {
			e.preventDefault();
		}
		window.addEventListener('beforeunload', handler);
		return () => window.removeEventListener('beforeunload', handler);
	});

	function prevWeek() {
		weekOffset--;
		fetchMealPlan();
	}

	function nextWeek() {
		weekOffset++;
		fetchMealPlan();
	}

	function thisWeek() {
		weekOffset = 0;
		fetchMealPlan();
	}

	// Only recipes from the coming Saturday onwards - the leading partial week
	// (today through Friday) is already being shopped for, so it's excluded.
	let weekRecipeIds = $derived([
		...new Set(
			days
				.filter((day) => day.date >= getNextSaturday())
				.flatMap((day) => day.entries.map((entry: any) => entry.recipe?.id).filter(Boolean))
		),
	]);

	async function handleAddWeekToShoppingList() {
		addingToShoppingList = true;
		addToShoppingListMessage = ``;

		const res = await postMutation(`
			mutation {
				addRecipesToShoppingList(recipeIds: ${JSON.stringify(weekRecipeIds)}) {
					success
				}
			}
		`);
		addingToShoppingList = false;

		addToShoppingListMessage = res?.data?.addRecipesToShoppingList?.success
			? `Added to shopping list.`
			: `Failed to add to shopping list.`;
	}

	// Meal entry create/edit modal
	let modalOpen = $state(false);
	let modalMode = $state<`create` | `edit`>(`create`);
	let draftId = $state(``);
	let draftDate = $state(``);
	let draftEntryType = $state(`dinner`);
	let draftLinkMode = $state<`recipe` | `custom`>(`recipe`);
	let draftTitle = $state(``);
	let draftText = $state(``);
	let draftRecipeId = $state<string | null>(null);
	let draftRecipeName = $state(``);
	let saving = $state(false);
	let saveError = $state(``);

	function openCreateModal(date: string) {
		modalMode = `create`;
		draftId = ``;
		draftDate = date;
		draftEntryType = `dinner`;
		draftLinkMode = `recipe`;
		draftTitle = ``;
		draftText = ``;
		draftRecipeId = null;
		draftRecipeName = ``;
		saveError = ``;
		modalOpen = true;
	}

	function openEditModal(entry: any, date: string) {
		modalMode = `edit`;
		draftId = entry.id;
		draftDate = date;
		draftEntryType = entry.entryType;
		draftLinkMode = entry.recipe ? `recipe` : `custom`;
		draftTitle = entry.title ?? ``;
		draftText = entry.text ?? ``;
		draftRecipeId = entry.recipe?.id ?? null;
		draftRecipeName = entry.recipe?.name ?? ``;
		saveError = ``;
		modalOpen = true;
	}

	const gqlStr = (value: string) => JSON.stringify(value);

	async function postMutation(mutation: string) {
		const token = await getToken();
		return fetch(getGraphqlUrl(), {
			method: `POST`,
			headers: {
				'Content-Type': `application/json`,
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
			body: JSON.stringify({ query: mutation }),
		}).then((r) => r.json());
	}

	async function handleSave() {
		saving = true;
		saveError = ``;

		const parts = [`date: ${gqlStr(draftDate)}`, `entryType: ${gqlStr(draftEntryType)}`];
		if (draftLinkMode === `recipe`) {
			parts.push(`recipeId: ${gqlStr(draftRecipeId ?? ``)}`);
		}
		else {
			parts.push(`title: ${gqlStr(draftTitle.trim())}`);
			if (draftText.trim()) parts.push(`text: ${gqlStr(draftText.trim())}`);
		}
		const args = parts.join(`, `);

		const mutation =
			modalMode === `create`
				? `mutation { createMealPlanEntry(${args}) { id } }`
				: `mutation { updateMealPlanEntry(id: ${gqlStr(draftId)}, ${args}) { id } }`;

		const res = await postMutation(mutation);
		saving = false;

		if (res?.errors) {
			saveError = `Failed to save meal.`;
			return;
		}

		modalOpen = false;
		fetchMealPlan(true);
	}

	async function handleDelete() {
		saving = true;
		saveError = ``;

		const res = await postMutation(`mutation { deleteMealPlanEntry(id: ${gqlStr(draftId)}) { success } }`);
		saving = false;

		if (res?.errors || !res?.data?.deleteMealPlanEntry?.success) {
			saveError = `Failed to delete meal.`;
			return;
		}

		modalOpen = false;
		fetchMealPlan(true);
	}

	// isToday/isYesterday are relative to the viewer's own clock, so they stay
	// here rather than coming from the API alongside the day grouping itself.
	let displayDays = $derived(
		days.map((day) => {
			const d = parseISO(day.date);
			return {
				...day,
				label: format(d, 'EEEE'),
				displayDate: format(d, DATE_FORMATS.short),
				isToday: isToday(d),
				isYesterday: isYesterday(d),
			};
		})
	);
</script>

<svelte:head>
	<title>{getPageTitle(`Meal Plan`)}</title>
</svelte:head>

<h1>Meal Plan</h1>

{#if planningMode}
	<div class="planning-toolbar">
		<div class="week-select" role="radiogroup" aria-label="Weeks to plan">
			{#each [1, 2, 3, 4] as n (n)}
				<div class="week-option">
					<input
						type="radio"
						id="planning-weeks-{n}"
						name="planningWeeks"
						value={n}
						checked={planningWeeks === n}
						disabled={planningSaving}
						onchange={() => selectPlanningWeeks(n)}
					/>
					<label for="planning-weeks-{n}">{n} week{n > 1 ? `s` : ``}</label>
				</div>
			{/each}
		</div>
		{#if dirty}<span class="unsaved">Unsaved changes</span>{/if}
		<button type="button" onclick={handleSaveMealPlan} disabled={planningSaving || !dirty}>
			{planningSaving ? `Saving…` : `Save`}
		</button>
		<button type="button" class="exit-planning" onclick={exitPlanningMode} disabled={planningSaving}>Exit planning</button>
		<button
			type="button"
			onclick={handleAddWeekToShoppingList}
			disabled={addingToShoppingList || weekRecipeIds.length === 0}
		>
			{addingToShoppingList ? `Adding…` : `Add to shopping list`}
		</button>
		{#if planningSaveError}<span class="error">{planningSaveError}</span>{/if}
	</div>

	{#if addToShoppingListMessage}<p class="shopping-list-message">{addToShoppingListMessage}</p>{/if}
	{#if meatReminderMessage}<p class="shopping-list-message">{meatReminderMessage}</p>{/if}

	<MealPlanningPalette recipes={seasonRecipes} loading={seasonRecipesLoading} season={currentSeason} />

	{#if loading}
		<Skeleton rows={3} />
	{:else}
		<div class="week">
			{#each planningBoard as day (day.date)}
				{@const displayDay = displayDays.find((d) => d.date === day.date)}
				<MealPlanningDay
					date={day.date}
					label={displayDay?.label ?? ``}
					displayDate={displayDay?.displayDate ?? ``}
					isToday={displayDay?.isToday ?? false}
					eveningEvents={eveningEventsByDate.get(day.date) ?? []}
					bind:items={day.items}
					onAddMeal={() => openCreateModal(day.date)}
					onEditItem={(item) => openEditModal(item, item.date)}
				/>
			{/each}
		</div>
	{/if}
{:else}
	<nav class="week-nav">
		<button onclick={prevWeek}>← Previous</button>
		<button class="today" onclick={thisWeek}>This week</button>
		<button onclick={nextWeek}>Next →</button>
		<button type="button" onclick={startPlanningMode}>Start meal planning</button>
	</nav>

	{#if loading}
		<Skeleton rows={3} />
	{:else}
		<div class="week">
			{#each displayDays as day (day.date)}
				<DayColumn {day} eveningEvents={eveningEventsByDate.get(day.date) ?? []} />
			{/each}
		</div>
	{/if}
{/if}

<MealPlanEntryModal
	bind:open={modalOpen}
	mode={modalMode}
	date={draftDate}
	bind:entryType={draftEntryType}
	bind:linkMode={draftLinkMode}
	bind:title={draftTitle}
	bind:text={draftText}
	bind:recipeId={draftRecipeId}
	bind:recipeName={draftRecipeName}
	{saving}
	error={saveError}
	onSave={handleSave}
	onDelete={modalMode === `edit` ? handleDelete : undefined}
/>

<style>
	@import '@mixins';

	.week-nav {
		display: flex;
		gap: 0.5em;
		margin-bottom: 1.5em;

		& button {
			padding: 0.5em 1em;
			border: 1px solid var(--grey_light);
			border-radius: 0.3em;
			background: var(--transparent);
			color: var(--black);
			cursor: pointer;

			&.today {
				border-color: var(--purple_bright);
				background: var(--purple_bright);
				color: var(--purple_bright_text);
			}
		}
	}

	.planning-toolbar {
		display: flex;
		align-items: center;
		gap: 0.8em;
		margin-bottom: 1em;

		& button {
			padding: 0.5em 1em;
			border: 1px solid var(--grey_light);
			border-radius: 0.3em;
			background: var(--purple_bright);
			color: var(--purple_bright_text);
			cursor: pointer;

			&:disabled {
				opacity: 0.5;
				cursor: default;
			}

			&.exit-planning {
				background: var(--transparent);
				color: var(--navy);
			}
		}
	}

	.shopping-list-message {
		margin: -1em 0 1.5em;
		color: var(--grey);
		font-size: 0.85em;
	}

	.unsaved {
		color: var(--grey);
		font-size: 0.85em;
		font-style: italic;
	}

	.error {
		color: var(--red);
		font-size: 0.85em;
	}

	.week-select {
		display: flex;
		gap: 0.8em;
		margin-right: auto;

		& .week-option {
			display: flex;
			align-items: center;
			color: var(--navy);
			font-size: 0.9em;
			cursor: pointer;
			gap: 0.3em;
		}
	}

	.week {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: 0.5em;

		@media (width <= 900px) {
			grid-template-columns: 1fr;
		}
	}

</style>
