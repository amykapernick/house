<script lang="ts">
	import { isAuthenticated, getToken } from '$lib/auth';
	import fetchClientData, { getGraphqlUrl } from '$utils/fetchClientData';
	import { getWeekRange } from '$utils/dateRanges';
	import { resolve } from '$app/paths';
	import { format, parseISO, isToday, isYesterday, intervalToDuration } from 'date-fns';
	import MealPlanEntryModal from '$lib/components/partials/mealPlan/MealPlanEntryModal.svelte';

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

	function fetchMealPlan(skipCache = false) {
		loading = true;
		const range = getWeekRange(weekOffset);

		function handleMealPlan(res: any) {
			days = res.mealPlanByDay ?? [];
			loading = false;
		}

		fetchClientData({
			cacheKey: `mealplan-${range.start}`,
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

<nav class="week-nav">
	<button onclick={prevWeek}>← Previous</button>
	<button onclick={() => fetchMealPlan(true)} class="refresh">Refresh</button>
	<button class="today" onclick={thisWeek}>This week</button>
	<button onclick={nextWeek}>Next →</button>
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
								<button
									type="button"
									class="edit-btn"
									onclick={() => openEditModal(entry, day.date)}
									aria-label="Edit meal"
								>✎</button>
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

				<button type="button" class="add-meal" onclick={() => openCreateModal(day.date)}>+ Add meal</button>
			</div>
		{/each}
	</div>
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

			&.refresh {
				margin-left: auto;
			}
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

	.edit-btn {
		flex-shrink: 0;
		border: none;
		background: none;
		color: var(--grey);
		cursor: pointer;
		font-size: 0.75em;
		padding: 0;
		line-height: 1;

		&:hover {
			color: var(--purple_bright);
		}
	}

	.add-meal {
		width: 100%;
		margin-top: 0.3em;
		padding: 0.4em;
		border: 1px dashed var(--grey_light);
		border-radius: 0.3em;
		background: transparent;
		color: var(--grey);
		font-size: 0.75em;
		cursor: pointer;

		&:hover {
			border-color: var(--purple_bright);
			color: var(--purple_bright);
		}
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
