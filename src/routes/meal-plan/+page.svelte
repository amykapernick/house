<script lang="ts">
	import { isAuthenticated, getToken } from '$lib/auth';
	import fetchClientData, { getGraphqlUrl } from '$utils/fetchClientData';
	import { prefetchRecipes } from '$utils/prefetchRecipes';
	import { getWeekRange, getPlanningRange, getNextSaturday } from '$utils/dateRanges';
	import { getCurrentNoongarSeason } from '$utils/noongarSeason';
	import { buildMealPlanSaveOps, type PlanningDay, type PlanningDndItem, type PlanningRecipe } from '$utils/mealPlanningDnd';
	import { resolve } from '$app/paths';
	import { beforeNavigate } from '$app/navigation';
	import { format, parseISO, isToday, isYesterday, intervalToDuration } from 'date-fns';
	import { SvelteMap } from 'svelte/reactivity';
	import parseEvents from '$utils/calendar/parseEvents';
	import MealPlanEntryModal from '$lib/components/partials/mealPlan/MealPlanEntryModal.svelte';
	import MealPlanningPalette from '$lib/components/partials/mealPlan/MealPlanningPalette.svelte';
	import MealPlanningDay from '$lib/components/partials/mealPlan/MealPlanningDay.svelte';

	function formatMinutes(mins: number | string | null): string {
		if (!mins) return '';
		const m = typeof mins === 'string' ? parseInt(mins, 10) : mins;
		if (isNaN(m) || m <= 0) return '';
		const { hours, minutes } = intervalToDuration({ start: 0, end: m * 60 * 1000 });
		if (hours && minutes) return `${hours}h ${minutes}m`;
		if (hours) return `${hours}h`;
		return `${minutes}m`;
	}

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
			const dateKey = format(event.start, `yyyy-MM-dd`);
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
		fetchSeasonRecipes();
		fetchMealPlan(true);
	}

	function selectPlanningWeeks(weeks: number) {
		if (weeks === planningWeeks) return;
		if (dirty && !confirm(`Discard unsaved meal plan changes?`)) return;
		planningWeeks = weeks;
		addToShoppingListMessage = ``;
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
				displayDate: format(d, 'd MMM'),
				isToday: isToday(d),
				isYesterday: isYesterday(d),
			};
		})
	);
</script>

<svelte:head>
	<title>Meal Plan | Kapers Crewe Household</title>
</svelte:head>

<h1>Meal Plan</h1>

{#if planningMode}
	<div class="planning-toolbar">
		<div class="week-select" role="radiogroup" aria-label="Weeks to plan">
			{#each [1, 2, 3, 4] as n (n)}
				<label class="week-option">
					<input
						type="radio"
						name="planningWeeks"
						value={n}
						checked={planningWeeks === n}
						disabled={planningSaving}
						onchange={() => selectPlanningWeeks(n)}
					/>
					{n} week{n > 1 ? `s` : ``}
				</label>
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

	<MealPlanningPalette recipes={seasonRecipes} loading={seasonRecipesLoading} season={currentSeason} />

	{#if loading}
		<p>Loading...</p>
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
		<p>Loading...</p>
	{:else}
		<div class="week">
			{#each displayDays as day (day.date)}
			<div class="day" class:today={day.isToday} class:yesterday={day.isYesterday}>
				<h2>
					{day.label}
					<span class="date">{day.displayDate}</span>
				</h2>

				{#if day.entries.length === 0}
					<p class="empty">No meals planned</p>
				{:else}
					{#each day.entries as entry (entry.id)}
						<div class="meal">
							<div class="meal-header">
								<span class="meal-type">{entry.entryType}</span>
							</div>
							{#if entry.recipe}
								<a href={resolve('/recipes/[slug]', { slug: entry.recipe.slug })} class="recipe-link">
									{#if entry.recipe.image}
										<img src={entry.recipe.image} alt={entry.recipe.name} loading="lazy" />
									{/if}
									<span class="recipe-name">{entry.recipe.name}</span>
								</a>
								{#if entry.recipe.totalTime || entry.recipe.servings}
									<span class="recipe-meta">
										{#if entry.recipe.totalTime}{formatMinutes(entry.recipe.totalTime)}{/if}
										{#if entry.recipe.servings} · {entry.recipe.servings} servings{/if}
									</span>
								{/if}
							{:else if entry.title}
								<span class="recipe-name">{entry.title}</span>
								{#if entry.text}<p class="meal-text">{entry.text}</p>{/if}
							{/if}
						</div>
					{/each}
				{/if}

				{#if eveningEventsByDate.get(day.date)?.length}
					<ul class="evening-events">
						{#each eveningEventsByDate.get(day.date) as event (event.id)}
							<li>
								<span class="event-title">{event.title}</span>
								<span class="event-time">{format(event.start, `h:mma`)}–{format(event.end, `h:mma`)}</span>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
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
			background: transparent;
			cursor: pointer;

			&.today {
				background: var(--purple_bright);
				color: var(--purple_bright_text);
				border-color: var(--purple_bright);
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
				background: transparent;
				color: var(--navy);
			}
		}
	}

	.shopping-list-message {
		font-size: 0.85em;
		color: var(--grey);
		margin: -1em 0 1.5em;
	}

	.unsaved {
		font-size: 0.85em;
		color: var(--grey);
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
			gap: 0.3em;
			font-size: 0.9em;
			color: var(--navy);
			cursor: pointer;
		}
	}

	.week {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: 0.5em;

		@media (max-width: 900px) {
			grid-template-columns: 1fr;
		}
	}

	.day {
		border: 1px solid var(--grey_light);
		border-radius: 0.3em;
		padding: 0.8em;
		min-height: 150px;

		&.today {
			border-color: var(--purple_bright);
			background: color-mix(in srgb, var(--purple_bright) 4%, transparent);
		}

		&.yesterday {
			opacity: 0.5;
		}

		& h2 {
			font-size: 0.85em;
			margin: 0 0 0.5em;
			display: flex;
			flex-direction: column;
		}
	}

	.date {
		font-size: 0.85em;
		font-weight: 400;
		color: var(--grey);
	}

	.empty {
		font-size: 0.8em;
		color: var(--grey);
		font-style: italic;
	}

	.meal {
		margin-bottom: 0.5em;
		padding: 0.4em;
		background: color-mix(in srgb, var(--blue) 6%, transparent);
		border-radius: 0.3em;
	}

	.meal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5em;
	}

	.meal-type {
		display: inline-block;
		font-size: 0.65em;
		text-transform: uppercase;
		font-weight: 600;
		color: var(--grey);
		margin-bottom: 0.2em;
	}

	.evening-events {
		margin: 0.6em 0 0;
		padding: 0.5em 0 0;
		border-top: 1px dashed var(--grey_light);
		list-style: none;
		font-size: 0.75em;

		& li {
			display: flex;
			justify-content: space-between;
			gap: 0.5em;
			margin-bottom: 0.2em;
		}
	}

	.event-title {
		color: var(--navy);
	}

	.event-time {
		flex-shrink: 0;
		color: var(--grey);
	}

	.recipe-link {
		display: block;
		text-decoration: none;
		color: inherit;

		&:hover .recipe-name {
			text-decoration: underline;
		}

		& img {
			width: 100%;
			height: 60px;
			object-fit: cover;
			border-radius: 0.2em;
			margin-bottom: 0.3em;
		}
	}

	.recipe-name {
		font-size: 0.85em;
		font-weight: 600;
		line-height: 1.2;
	}

	.recipe-meta {
		display: block;
		font-size: 0.7em;
		color: var(--grey);
	}

	.meal-text {
		font-size: 0.8em;
		color: var(--grey);
		margin: 0.2em 0 0;
	}
</style>
