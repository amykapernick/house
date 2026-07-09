<script lang="ts">
	import { isAuthenticated } from '$lib/auth';
	import { intervalToDuration, format, startOfDay, addDays } from 'date-fns';
	import fetchClientData from '$utils/fetchClientData';
	import { prefetchRecipes } from '$utils/prefetchRecipes';
	import { getWeekRange } from '$utils/dateRanges';
	import { resolve } from '$app/paths';

	let meals = $state<any[]>([]);
	let loading = $state(true);

	let upcomingTasks = $state<any[]>([]);
	let upcomingEvents = $state<any[]>([]);
	let upcomingLoading = $state(true);

	function formatMinutes(mins: number | string | null): string {
		if (!mins) return '';
		const m = typeof mins === 'string' ? parseInt(mins, 10) : mins;
		if (isNaN(m) || m <= 0) return '';
		const { hours, minutes } = intervalToDuration({ start: 0, end: m * 60 * 1000 });
		if (hours && minutes) return `${hours}h ${minutes}m`;
		if (hours) return `${hours}h`;
		return `${minutes}m`;
	}

	$effect(() => {
		if ($isAuthenticated) {
			const { start, end } = getWeekRange();

			function handleMeals(res: any) {
				meals = res.mealPlans?.items ?? [];
				loading = false;
				prefetchRecipes(meals.map((meal) => meal.recipe?.slug));
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
			const startOfToday = startOfDay(new Date());
			const in7Days = addDays(startOfToday, 7);

			function handleUpcoming(res: any) {
				upcomingTasks = res.tasks ?? [];
				upcomingEvents = (res.events ?? []).filter((event: any) => {
					if (!event.dates?.start) return false;
					const start = new Date(event.dates.start);
					return start >= startOfToday && start <= in7Days;
				});
				upcomingLoading = false;
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
							dueLabel(today: "${today}")
						}
						events {
							id
							name
							dates { start end }
						}
					}
				`,
			}).then(handleUpcoming);
		}
	});

	let upcomingItems = $derived.by(() => {
		const items: { id: string; label: string; date: Date; meta: string }[] = [];

		for (const task of upcomingTasks) {
			if (task.status === 'Done' || !task.dueLabel || !task.due) continue;
			items.push({ id: `task-${task.id}`, label: task.name, date: new Date(task.due), meta: task.dueLabel });
		}

		for (const event of upcomingEvents) {
			items.push({
				id: `event-${event.id}`,
				label: event.name,
				date: new Date(event.dates.start),
				meta: format(new Date(event.dates.start), 'dd MMM'),
			});
		}

		return items.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 6);
	});

	let weekRecipes = $derived.by(() => {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- built and discarded synchronously within this derivation, never read reactively
		const seen = new Set<string>();
		const recipes: any[] = [];
		for (const meal of meals) {
			if (!meal.recipe?.slug || seen.has(meal.recipe.slug)) continue;
			seen.add(meal.recipe.slug);
			recipes.push(meal.recipe);
		}
		return recipes;
	});
</script>

<svelte:head>
	<title>Dashboard | Kapers Crewe Household</title>
</svelte:head>

<h1>Dashboard</h1>

{#if $isAuthenticated}
	<section class="widget">
		<div class="widget-header">
			<h2>Upcoming</h2>
			<a href={resolve('/calendar')}>View calendar</a>
		</div>

		{#if upcomingLoading}
			<p>Loading...</p>
		{:else if upcomingItems.length === 0}
			<p class="empty">Nothing due in the next week.</p>
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
			<h2>This week's meals</h2>
			<a href={resolve('/meal-plan')}>View all</a>
		</div>

		{#if loading}
			<p>Loading...</p>
		{:else if weekRecipes.length === 0}
			<p class="empty">No meals planned this week.</p>
		{:else}
			<div class="grid">
				{#each weekRecipes as recipe (recipe.slug)}
					<a class="card" href={resolve('/recipes/[slug]', { slug: recipe.slug })}>
						{#if recipe.image}
							<img src={recipe.image} alt={recipe.name} loading="lazy" />
						{:else}
							<div class="no-image"></div>
						{/if}
						<div class="info">
							<h3>{recipe.name}</h3>
							{#if recipe.description}
								<p class="description">{recipe.description}</p>
							{/if}
							<div class="meta">
								{#if recipe.totalTime}<span>{formatMinutes(recipe.totalTime)}</span>{/if}
								{#if recipe.servings}<span>{recipe.servings} servings</span>{/if}
							</div>
							{#if recipe.tags?.length}
								<ul class="tags">
									{#each recipe.tags as tag (tag.slug)}
										<li>{tag.name}</li>
									{/each}
								</ul>
							{/if}
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</section>
{:else}
	<p class="empty">Sign in to see your upcoming tasks and this week's meals.</p>
{/if}

<style>
	@import '@mixins';

	.widget {
		margin-bottom: 2em;
	}

	.widget-header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
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

	.empty {
		color: var(--grey);
		font-style: italic;
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

	.card {
		border: 1px solid var(--grey_light);
		border-radius: 0.5em;
		overflow: hidden;
		text-decoration: none;
		color: inherit;
		transition: box-shadow 0.2s;

		&:hover {
			box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		}

		& img {
			width: 100%;
			height: 140px;
			object-fit: cover;
			display: block;
		}

		& .no-image {
			width: 100%;
			height: 140px;
			background: color-mix(in srgb, var(--purple_bright) 8%, transparent);
		}
	}

	.info {
		padding: 0.6em;

		& h3 {
			font-size: 0.9em;
			margin: 0 0 0.2em;
			line-height: 1.3;
		}
	}

	.description {
		font-size: 0.8em;
		color: var(--grey);
		margin: 0 0 0.3em;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.meta {
		display: flex;
		gap: 0.8em;
		font-size: 0.75em;
		color: var(--grey);
		margin-bottom: 0.3em;
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
