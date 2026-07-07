<script lang="ts">
	import { isAuthenticated } from '$lib/auth';
	import fetchClientData from '$utils/fetchClientData';
	import { resolve } from '$app/paths';
	import {
		format, startOfWeek, endOfWeek, addWeeks, addDays, subDays,
		eachDayOfInterval, isToday, isYesterday, parseISO, intervalToDuration
	} from 'date-fns';

	function formatMinutes(mins: number | string | null): string {
		if (!mins) return '';
		const m = typeof mins === 'string' ? parseInt(mins, 10) : mins;
		if (isNaN(m) || m <= 0) return '';
		const { hours, minutes } = intervalToDuration({ start: 0, end: m * 60 * 1000 });
		if (hours && minutes) return `${hours}h ${minutes}m`;
		if (hours) return `${hours}h`;
		return `${minutes}m`;
	}

	let entries = $state<any[]>([]);
	let loading = $state(true);
	let weekOffset = $state(0);

	function getOffsetWeekRange(offset: number) {
		const yesterday = subDays(addWeeks(new Date(), offset), 1);
		const end = addDays(yesterday, 7);

		return {
			start: format(yesterday, 'yyyy-MM-dd'),
			end: format(end, 'yyyy-MM-dd'),
		};
	}

	function fetchMealPlan(skipCache = false) {
		loading = true;
		const range = getOffsetWeekRange(weekOffset);

		fetchClientData({
			cacheKey: `mealplan-${range.start}`,
			skipCache,
			gqlQuery: `
				query {
					mealPlans(
						perPage: 50
						startDate: "${range.start}"
						endDate: "${range.end}"
						orderBy: "date"
						orderDirection: "asc"
					) {
						items {
							id date entryType title text
							recipe {
								name slug image
								totalTime servings
								tags { name slug }
							}
						}
					}
				}
			`,
		}).then((res) => {
			entries = res.mealPlans?.items ?? [];
			loading = false;
		});
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

	function entriesByDay() {
		const range = getOffsetWeekRange(weekOffset);
		const start = parseISO(range.start);
		const end = parseISO(range.end);
		const days = eachDayOfInterval({ start, end });

		const grouped = days.map(d => ({
			label: format(d, 'EEEE'),
			date: format(d, 'yyyy-MM-dd'),
			displayDate: format(d, 'd MMM'),
			isToday: isToday(d),
			isYesterday: isYesterday(d),
			entries: [] as any[],
		}));

		for (const entry of entries) {
			const day = grouped.find(d => d.date === entry.date);
			if (day) day.entries.push(entry);
		}

		return grouped;
	}
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
		{#each entriesByDay() as day (day.date)}
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
							<span class="meal-type">{entry.entryType}</span>
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
			</div>
		{/each}
	</div>
{/if}

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
				color: white;
				border-color: var(--purple_bright);
			}

			&.refresh {
				margin-left: auto;
			}
		}
	}

	.week {
		display: grid;
		grid-template-columns: repeat(8, 1fr);
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

	.meal-type {
		display: inline-block;
		font-size: 0.65em;
		text-transform: uppercase;
		font-weight: 600;
		color: var(--grey);
		margin-bottom: 0.2em;
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
