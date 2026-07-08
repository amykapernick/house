<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { addDays, format, isToday, isTomorrow, parseISO } from 'date-fns';
	import { SvelteMap } from 'svelte/reactivity';
	import fetchClientData from '$utils/fetchClientData';
	import { getRecentPages } from '$utils/recentPages';
	import type { MenuItem } from '$types/global';
	import type { Component } from 'svelte';
	import RecipeIcon from '$img/icons/recipe-book-47.svg?component';

	let {
		menuItems,
		isAuthenticated,
		open = $bindable(false),
	}: {
		menuItems: MenuItem[];
		isAuthenticated: boolean;
		open?: boolean;
	} = $props();

	type Result = {
		key: string;
		label: string;
		sublabel?: string;
		section: `Recent` | `Pages` | `Recipes`;
		link: string;
		Icon: Component<Record<string, any>>;
	};

	type PlannedMeal = { date: string; entryType: string };

	const RECIPE_MIN_CHARS = 2;
	const RECIPE_DEBOUNCE_MS = 250;
	const RECIPE_FETCH_COUNT = 15; // fetched so upcoming meal-plan matches outside the top few can still surface
	const RECIPE_DISPLAY_LIMIT = 5;
	const MEAL_PLAN_LOOKAHEAD_DAYS = 7;

	let dialogEl: HTMLDialogElement | undefined = $state();
	let inputEl: HTMLInputElement | undefined = $state();
	let resultsEl: HTMLUListElement | undefined = $state();
	let query = $state(``);
	let activeIndex = $state(0);
	let recentLinks = $state<string[]>([]);
	let recipeResults = $state<Result[]>([]);
	let recipesLoading = $state(false);
	let upcomingMealPlan = new SvelteMap<string, PlannedMeal>();
	let mealPlanLoaded = false;

	function flattenPages(items: MenuItem[], sublabel?: string): Result[] {
		return items.flatMap((item) => {
			if (item.auth && !isAuthenticated) return [];
			if (item.items) return flattenPages(item.items, item.label);
			return [{ key: `page:${item.link}`, label: item.label, sublabel, section: `Pages` as const, link: item.link, Icon: item.Icon }];
		});
	}

	const pages = $derived(flattenPages(menuItems));

	const term = $derived(query.trim().toLowerCase());

	const recentResults = $derived(
		term
			? []
			: recentLinks
				.map((link) => pages.find((page) => page.link === link))
				.filter((page): page is Result => !!page)
				.map((page) => ({ ...page, key: `recent:${page.link}`, section: `Recent` as const }))
	);

	const pageResults = $derived(
		term
			? pages.filter((page) => page.label.toLowerCase().includes(term))
			: pages.filter((page) => !recentLinks.includes(page.link))
	);

	const results = $derived([...recentResults, ...pageResults, ...recipeResults]);

	function escapeGqlString(value: string): string {
		return value.replace(/\\/g, `\\\\`).replace(/"/g, `\\"`);
	}

	async function loadUpcomingMealPlan() {
		if (!isAuthenticated || mealPlanLoaded) return;
		mealPlanLoaded = true;
		const start = format(new Date(), `yyyy-MM-dd`);
		const end = format(addDays(new Date(), MEAL_PLAN_LOOKAHEAD_DAYS), `yyyy-MM-dd`);
		const res = await fetchClientData({
			cacheKey: `mealplan-upcoming-${start}`,
			gqlQuery: `
				query {
					mealPlanByDay(startDate: "${start}", endDate: "${end}") {
						date
						entries { entryType recipe { slug } }
					}
				}
			`,
		});
		const map = new SvelteMap<string, PlannedMeal>();
		for (const day of res.mealPlanByDay ?? []) {
			for (const entry of day.entries ?? []) {
				if (entry.recipe?.slug && !map.has(entry.recipe.slug)) {
					map.set(entry.recipe.slug, { date: day.date, entryType: entry.entryType });
				}
			}
		}
		upcomingMealPlan = map;
	}

	function formatPlannedLabel(planned: PlannedMeal): string {
		const date = parseISO(planned.date);
		const when = isToday(date) ? `Today` : isTomorrow(date) ? `Tomorrow` : format(date, `EEE`);
		const type = planned.entryType ? planned.entryType.charAt(0).toUpperCase() + planned.entryType.slice(1) : ``;
		return type ? `${when} · ${type}` : when;
	}

	async function searchRecipes(searchTerm: string, token: number) {
		recipesLoading = true;
		const res = await fetchClientData({
			gqlQuery: `
				query {
					recipes(page: 1, perPage: ${RECIPE_FETCH_COUNT}, queryFilter: "${escapeGqlString(searchTerm)}") {
						items { name slug }
					}
				}
			`,
		});
		if (token !== recipeSearchToken) return; // a newer search superseded this one
		const items: { name: string; slug: string }[] = res.recipes?.items ?? [];
		const sorted = [...items].sort((a, b) => {
			const aPlanned = upcomingMealPlan.has(a.slug);
			const bPlanned = upcomingMealPlan.has(b.slug);
			return aPlanned === bPlanned ? 0 : aPlanned ? -1 : 1;
		});
		recipeResults = sorted.slice(0, RECIPE_DISPLAY_LIMIT).map((recipe) => {
			const planned = upcomingMealPlan.get(recipe.slug);
			return {
				key: `recipe:${recipe.slug}`,
				label: recipe.name,
				sublabel: planned ? formatPlannedLabel(planned) : undefined,
				section: `Recipes` as const,
				link: resolve(`/recipes/[slug]`, { slug: recipe.slug }),
				Icon: RecipeIcon,
			};
		});
		recipesLoading = false;
	}

	let recipeSearchToken = 0;
	let recipeDebounceTimer: ReturnType<typeof setTimeout> | undefined;

	$effect(() => {
		const searchTerm = term;
		clearTimeout(recipeDebounceTimer);
		recipeSearchToken += 1;
		if (searchTerm.length < RECIPE_MIN_CHARS) {
			recipeResults = [];
			recipesLoading = false;
			return;
		}
		const token = recipeSearchToken;
		recipeDebounceTimer = setTimeout(() => searchRecipes(searchTerm, token), RECIPE_DEBOUNCE_MS);
		return () => clearTimeout(recipeDebounceTimer);
	});

	$effect(() => {
		if (activeIndex >= results.length) activeIndex = Math.max(results.length - 1, 0);
	});

	$effect(() => {
		void activeIndex; // read to trigger this effect when the active item changes
		resultsEl?.querySelector(`[data-active='true']`)?.scrollIntoView({ block: `nearest` });
	});

	$effect(() => {
		if (!dialogEl) return;
		if (open && !dialogEl.open) {
			query = ``;
			activeIndex = 0;
			recipeResults = [];
			recentLinks = getRecentPages();
			loadUpcomingMealPlan();
			dialogEl.showModal();
			inputEl?.focus();
		}
		if (!open && dialogEl.open) dialogEl.close();
	});

	function select(result: Result) {
		open = false;
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- result.link is already resolve()d above
		goto(result.link);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === `ArrowDown`) {
			event.preventDefault();
			activeIndex = Math.min(activeIndex + 1, results.length - 1);
		} else if (event.key === `ArrowUp`) {
			event.preventDefault();
			activeIndex = Math.max(activeIndex - 1, 0);
		} else if (event.key === `Enter`) {
			event.preventDefault();
			const result = results[activeIndex];
			if (result) select(result);
		}
	}
</script>

<dialog
	bind:this={dialogEl}
	class="palette"
	onclose={() => (open = false)}
	onclick={(event) => {
		if (event.target === dialogEl) open = false;
	}}
>
	<input
		bind:this={inputEl}
		bind:value={query}
		type="text"
		class="query"
		placeholder="Go to a page or search recipes..."
		aria-label="Search pages and recipes"
		autocomplete="off"
		onkeydown={handleKeydown}
	/>
	<ul class="results" bind:this={resultsEl}>
		{#each results as result, i (result.key)}
			{#if i === 0 || results[i - 1].section !== result.section}
				<li class="heading">{result.section}</li>
			{/if}
			<li>
				<button
					type="button"
					class="result"
					data-active={i === activeIndex}
					onmouseenter={() => (activeIndex = i)}
					onclick={() => select(result)}
				>
					<result.Icon />
					<span class="label">{result.label}</span>
					{#if result.sublabel}<span class="sublabel">{result.sublabel}</span>{/if}
				</button>
			</li>
		{/each}
		{#if term.length >= RECIPE_MIN_CHARS && recipesLoading && recipeResults.length === 0}
			<li class="hint">Searching recipes...</li>
		{/if}
		{#if results.length === 0 && !recipesLoading}
			<li class="hint">No matching pages or recipes</li>
		{/if}
	</ul>
	<footer class="footer">
		<span><kbd>&uarr;</kbd><kbd>&darr;</kbd> navigate</span>
		<span><kbd>&crarr;</kbd> select</span>
		<span><kbd>esc</kbd> close</span>
	</footer>
</dialog>

<style>
	@import '@mixins';

	dialog.palette {
		position: fixed;
		top: 15vh;
		left: 50%;
		width: 90vw;
		max-width: 500px;
		margin: 0;
		padding: 0;
		transform: translateX(-50%);
		border: none;
		border-radius: 0.5em;
		overflow: hidden;
		background: var(--background);
		color: var(--background_text);
		box-shadow: 0 5px 30px color-mix(in srgb, var(--neutral) 30%, transparent);

		&::backdrop {
			background: color-mix(in srgb, var(--neutral) 60%, transparent);
		}
	}

	.query {
		width: 100%;
		margin: 0;
		padding: 1em;
		border: none;
		border-bottom: 1px solid var(--neutral_light);
		border-radius: 0;
		background: none;
		color: inherit;
		font-size: 1.2em;

		&:focus {
			outline: none;
		}
	}

	.results {
		margin: 0;
		padding: 0.5em;
		max-height: 50vh;
		overflow-y: auto;
		list-style: none;

		& li {
			margin: 0;
			padding: 0;
		}
	}

	.heading {
		padding: 0.6em 0.75em 0.2em;
		color: var(--neutral);
		font-size: 0.75em;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.result {
		display: flex;
		align-items: center;
		gap: 0.75em;
		width: 100%;
		margin: 0;
		padding: 0.6em 0.75em;
		border: none;
		border-radius: 0.35em;
		background: none;
		color: inherit;
		font-size: 1em;
		font-weight: inherit;
		text-align: left;
		cursor: pointer;

		&[data-active='true'] {
			background: var(--purple_bright);
			color: var(--purple_bright_text);
		}

		& :global(svg) {
			flex-shrink: 0;
			width: 1.2em;
			height: 1.2em;
		}
	}

	.label {
		flex: 1;
	}

	.sublabel {
		color: var(--neutral);
		font-size: 0.8em;
	}

	.hint {
		padding: 0.6em 0.75em;
		color: var(--neutral);
	}

	.footer {
		display: flex;
		gap: 1em;
		padding: 0.6em 1em;
		border-top: 1px solid var(--neutral_light);
		color: var(--neutral);
		font-size: 0.75em;

		& kbd {
			padding: 0.1em 0.4em;
			border: 1px solid var(--neutral_light);
			border-radius: 0.25em;
			font-family: inherit;
		}
	}
</style>
