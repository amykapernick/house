<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { isAuthenticated } from '$lib/auth';
	import { menuItems, routeRequiresAuth } from '$lib/navigation';
	import fetchClientData from '$utils/fetchClientData';
	import fetchTasksData from '$utils/tasksData';
	import { CONTENT_CACHE_TTL, contentEntriesQuery, contentIndexQuery } from '$utils/content';
	import { getDiscoverableRoutes, flattenPages } from '$utils/routes';
	import { SCOPE_TOKENS, type SearchSection } from '$utils/commandPaletteSearch';
	import {
		type Result,
		type ContentEntryResult,
		type ContentPageResult,
		buildContentResults,
		buildReferenceResults,
		buildSupplierResults,
		buildAssetResults,
		buildSmallHumanResults,
		buildTaskResults,
		buildShoppingListResults,
		buildBudgetResults,
		buildScheduleResults,
	} from '$utils/searchResults';
	import { getPageTitle } from '$utils/pageTitle';
	import Skeleton from '$parts/Skeleton.svelte';
	import EmptyState from '$parts/EmptyState.svelte';
	import ContentIcon from '$parts/ContentIcon.svelte';
	import RecipeIcon from '$img/icons/recipe-book-47.svg?component';

	const RECIPE_MIN_CHARS = 2;
	const RECIPE_DEBOUNCE_MS = 250;
	const RECIPE_FETCH_COUNT = 50; // unlimited-ish - the palette only fetches 15/shows 5

	type SectionFilter = SearchSection | `All`;
	const SECTION_OPTIONS: SectionFilter[] = [`All`, ...Object.values(SCOPE_TOKENS)];

	// queryInput tracks the text field as the user types; query is only updated
	// on form submit, so results (and the URL) don't change on every keystroke.
	let queryInput = $state(page.url.searchParams.get(`q`) ?? ``);
	let query = $state(page.url.searchParams.get(`q`) ?? ``);
	let section = $state<SectionFilter>((page.url.searchParams.get(`section`) as SectionFilter) ?? `All`);

	const term = $derived(query.trim().toLowerCase());

	function sectionActive(s: SearchSection): boolean {
		return section === `All` || section === s;
	}

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		query = queryInput;
	}

	// Keeps the URL in sync with the committed query/section filter so results
	// stay linkable/shareable - only fires on submit or a section change, not
	// on every keystroke (queryInput isn't a dependency here).
	$effect(() => {
		const q = query;
		const s = section;
		const params = new SvelteURLSearchParams();
		if (q) params.set(`q`, q);
		if (s !== `All`) params.set(`section`, s);
		const search = params.toString();
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- resolve() is used; the rule can't trace it through template-literal concatenation with the query string
		goto(`${resolve(`/search`)}${search ? `?${search}` : ``}`, { replaceState: true, keepFocus: true, noScroll: true });
	});

	let contentEntries = $state<ContentEntryResult[]>([]);
	let contentPages = $state<ContentPageResult[]>([]);
	let resources = $state<any[]>([]);
	let suppliers = $state<any[]>([]);
	let assets = $state<any[]>([]);
	let smallHuman = $state<any>(null);
	let searchTasks = $state<any[]>([]);
	let shoppingListItems = $state<any[]>([]);
	let budgetItems = $state<any[]>([]);
	let scheduleEvents = $state<any[]>([]);
	let icsEvents = $state<any[]>([]);
	let dataLoading = $state(true);

	let recipeResults = $state<Result[]>([]);
	let recipesLoading = $state(false);
	let recipeSearchToken = 0;

	function escapeGqlString(value: string): string {
		return value.replace(/\\/g, `\\\\`).replace(/"/g, `\\"`);
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
		recipeResults = items.map((recipe) => ({
			key: `recipe:${recipe.slug}`,
			label: recipe.name,
			section: `Recipes` as const,
			link: resolve(`/recipes/[slug]`, { slug: recipe.slug }),
			Icon: RecipeIcon,
		}));
		recipesLoading = false;
	}

	let recipeDebounceTimer: ReturnType<typeof setTimeout> | undefined;
	$effect(() => {
		const searchTerm = term;
		const active = sectionActive(`Recipes`);
		clearTimeout(recipeDebounceTimer);
		recipeSearchToken += 1;
		if (!active || searchTerm.length < RECIPE_MIN_CHARS) {
			recipeResults = [];
			recipesLoading = false;
			return;
		}
		const token = recipeSearchToken;
		recipeDebounceTimer = setTimeout(() => searchRecipes(searchTerm, token), RECIPE_DEBOUNCE_MS);
		return () => clearTimeout(recipeDebounceTimer);
	});

	// File-system routes never linked from the header nav (e.g. /reference/house)
	// - static per session, so computed once rather than re-derived every render.
	const discoveredRoutes = getDiscoverableRoutes();
	const navPages = $derived(flattenPages(menuItems, $isAuthenticated));
	const orphanPages = $derived<Result[]>(
		discoveredRoutes
			.filter((route) => $isAuthenticated || !routeRequiresAuth(route.path))
			.filter((route) => !navPages.some((navPage) => navPage.link === route.path))
			.map((route) => ({
				key: `page:${route.path}`,
				label: route.label,
				sublabel: route.sublabel,
				section: `Pages` as const,
				link: route.path,
			})),
	);
	const pages = $derived([...navPages, ...orphanPages]);

	const pageResults = $derived(term && sectionActive(`Pages`) ? pages.filter((p) => p.label.toLowerCase().includes(term)) : []);
	const contentResults = $derived(sectionActive(`Content`) ? buildContentResults(contentEntries, contentPages, term) : []);
	const referenceResults = $derived(sectionActive(`References`) ? buildReferenceResults(resources, term) : []);
	const supplierResults = $derived(sectionActive(`Suppliers`) ? buildSupplierResults(suppliers, term) : []);
	const assetResults = $derived(sectionActive(`Assets`) ? buildAssetResults(assets, term) : []);
	const smallHumanResults = $derived(sectionActive(`Small Human`) ? buildSmallHumanResults(smallHuman, term) : []);
	const taskResults = $derived(sectionActive(`Tasks`) ? buildTaskResults(searchTasks, term) : []);
	const shoppingListResults = $derived(sectionActive(`Shopping List`) ? buildShoppingListResults(shoppingListItems, term) : []);
	const budgetResults = $derived(sectionActive(`Budget`) ? buildBudgetResults(budgetItems, term) : []);
	const scheduleResults = $derived(sectionActive(`Schedule`) ? buildScheduleResults(scheduleEvents, icsEvents, term) : []);

	// Grouped rather than flattened - unlike the palette's single flat list,
	// a full page can afford (and benefits from) a heading per section.
	const groupedResults = $derived(
		[
			{ section: `Pages` as const, results: pageResults },
			{ section: `Recipes` as const, results: recipeResults },
			{ section: `Content` as const, results: contentResults },
			{ section: `References` as const, results: referenceResults },
			{ section: `Suppliers` as const, results: supplierResults },
			{ section: `Assets` as const, results: assetResults },
			{ section: `Small Human` as const, results: smallHumanResults },
			{ section: `Tasks` as const, results: taskResults },
			{ section: `Shopping List` as const, results: shoppingListResults },
			{ section: `Budget` as const, results: budgetResults },
			{ section: `Schedule` as const, results: scheduleResults },
		].filter((group) => group.results.length > 0),
	);

	const hasAnyResults = $derived(groupedResults.length > 0);

	// Every query/cacheKey below is copied verbatim from the section's own page
	// (or CommandPalette.svelte, for sections with no dedicated page) so the
	// shared localStorage cache entry stays one consistent shape. Unlike the
	// palette, nothing here is gated behind a scope token - this page IS the
	// deep-search surface, so everything loads unconditionally once opened.
	$effect(() => {
		if (!$isAuthenticated) return;
		dataLoading = true;

		const contentPromise = fetchClientData({
			cacheKey: `content-entries`,
			gqlQuery: contentEntriesQuery,
		}).then(async (res) => {
			contentEntries = res.contentEntries ?? [];
			const pagesByEntry = await Promise.all(
				contentEntries.map(async (entry) => {
					const indexRes = await fetchClientData({
						cacheKey: `content-index-${entry.slug}`,
						ttl: CONTENT_CACHE_TTL,
						gqlQuery: contentIndexQuery(entry.slug),
					});
					return (indexRes.contentIndex ?? []).flatMap((group: any) => (group.pages ?? []).map((page: any) => ({ entrySlug: entry.slug, pageSlug: page.slug, title: page.title, group: group.title })));
				}),
			);
			contentPages = pagesByEntry.flat();
		});

		const resourcesPromise = fetchClientData({
			cacheKey: `resources`,
			onStale: (res) => {
				resources = res.resources ?? [];
			},
			gqlQuery: `
				query {
					resources { name id category description image login url icon archived }
				}
			`,
		}).then((res) => {
			resources = res.resources ?? [];
		});

		const suppliersPromise = fetchClientData({
			cacheKey: `suppliers`,
			onStale: (res) => {
				suppliers = res.suppliers ?? [];
			},
			gqlQuery: `
				query {
					suppliers { name id category archived url lastUsed email phone }
				}
			`,
		}).then((res) => {
			suppliers = res.suppliers ?? [];
		});

		const assetsPromise = fetchClientData({
			cacheKey: `assets`,
			onStale: (res) => {
				assets = res.assets ?? [];
			},
			gqlQuery: `
				query {
					assets { name id icon content external category brand cost receipt dateOfPurchase ipAddress image macAddress model ramStorage status }
				}
			`,
		}).then((res) => {
			assets = res.assets ?? [];
		});

		const smallHumanPromise = fetchClientData({
			cacheKey: `small-human`,
			onStale: (res) => {
				smallHuman = res.smallHuman ?? null;
			},
			gqlQuery: `
				query {
					smallHuman {
						teeth { teeth { fdi name } }
						milestones { items { id title } }
						auslan { signs { id name } }
						swimming { skills { id title } }
						sleep { items { id title } }
						vaccinations { items { id title } }
						activities { id title }
						clothing { seasonal { alerts { id title } } }
						notes {
							__typename
							... on CarSeat { name }
							... on ParentingApproachNote { parentingApproachItems: items { id title } }
							... on ToddlerSleepPrepNote { name }
						}
					}
				}
			`,
		}).then((res) => {
			smallHuman = res.smallHuman ?? null;
		});

		const tasksPromise = fetchTasksData().then((tasks) => {
			searchTasks = tasks;
		});

		const shoppingListPromise = fetchClientData({
			cacheKey: `shopping-list`,
			onStale: (res) => {
				shoppingListItems = res.shoppingList?.items ?? [];
			},
			gqlQuery: `
				query {
					shoppingList {
						items { id display checked quantity note category labels source link recipes { id name slug } }
					}
				}
			`,
		}).then((res) => {
			shoppingListItems = res.shoppingList?.items ?? [];
		});

		const budgetPromise = fetchClientData({
			cacheKey: `budget`,
			onStale: (res) => {
				budgetItems = res.budget ?? [];
			},
			gqlQuery: `
				query {
					budget { id description amount period monthlyAmount income bucket { id name } tags note }
				}
			`,
		}).then((res) => {
			budgetItems = res.budget ?? [];
		});

		const calendarPromise = fetchClientData({
			cacheKey: `calendar`,
			onStale: (res) => {
				scheduleEvents = res.events ?? [];
			},
			gqlQuery: `
				query {
					tasks { id name assigned { name slug profile colour } status due end allDay estimate link platform }
					events { name dates { start end } status id }
				}
			`,
		}).then((res) => {
			scheduleEvents = res.events ?? [];
		});

		const icsEventsPromise = fetchClientData({
			cacheKey: `icsEvents`,
			onStale: (res) => {
				icsEvents = res.icsEvents ?? [];
			},
			gqlQuery: `
				query {
					icsEvents { id name dates { start end } status allDay colour family { slug } }
				}
			`,
		}).then((res) => {
			icsEvents = res.icsEvents ?? [];
		});

		Promise.allSettled([contentPromise, resourcesPromise, suppliersPromise, assetsPromise, smallHumanPromise, tasksPromise, shoppingListPromise, budgetPromise, calendarPromise, icsEventsPromise]).then(() => {
			dataLoading = false;
		});
	});
</script>

<svelte:head>
	<title>{getPageTitle(`Search`)}</title>
</svelte:head>

<section class="search">
	<h1>Search</h1>
	<form
		class="query-form"
		onsubmit={handleSubmit}
	>
		<input
			type="text"
			class="query"
			bind:value={queryInput}
			placeholder="Search everything..."
			aria-label="Search everything"
		/>
		<button type="submit">Search</button>
	</form>
	<div
		class="sections"
		role="group"
		aria-label="Filter by section"
	>
		{#each SECTION_OPTIONS as option (option)}
			<button
				type="button"
				class="section-pill"
				class:active={section === option}
				onclick={() => (section = option)}
			>
				{option}
			</button>
		{/each}
	</div>

	{#if !term}
		<EmptyState
			title="Search the whole app"
			message="Type above to search pages, recipes, references, tasks, and more."
			page
		/>
	{:else if dataLoading && !hasAnyResults}
		<Skeleton rows={5} />
	{:else if !hasAnyResults && !recipesLoading}
		<EmptyState
			title="No matches"
			message={section === `All` ? `No results for "${query}".` : `No results for "${query}" in ${section}.`}
			page
		/>
	{:else}
		{#each groupedResults as group (group.section)}
			<div class="group">
				<h2>{group.section}</h2>
				<ul class="results">
					{#each group.results as result (result.key)}
						<li>
							<!-- eslint-disable svelte/no-navigation-without-resolve -- result.link is already resolve()d (internal) or a raw external/mailto/tel URL, same as CommandPalette.svelte -->
							<a
								class="result"
								class:archived={result.archived}
								href={result.link}
								target={result.link.startsWith(`http`) ? `_blank` : undefined}
								rel={result.link.startsWith(`http`) ? `noreferrer` : undefined}
							>
								{#if result.contentIcon}
									<ContentIcon
										icon={result.contentIcon.icon}
										iconType={result.contentIcon.iconType}
									/>
								{:else if result.Icon}
									<result.Icon />
								{/if}
								<span class="label">{result.label}</span>
								{#if result.sublabel}<span class="sublabel">{result.sublabel}</span>{/if}
								{#if result.archived}<span class="tag-archived">Archived</span>{/if}
							</a>
							<!-- eslint-enable svelte/no-navigation-without-resolve -->
						</li>
					{/each}
				</ul>
			</div>
		{/each}
		{#if sectionActive(`Recipes`) && recipesLoading && recipeResults.length === 0}
			<p class="hint">Searching recipes...</p>
		{/if}
	{/if}
</section>

<style>
	@import '@mixins';

	.search {
		max-width: 700px;
		margin: 0 auto;
		padding: 1em;
	}

	/* Overrides global `form { padding, font-size }` (config/postcss - see
	   forms.css) - that's sized for stacked modal-style forms, not this
	   single-row search bar. */

	.query-form {
		display: flex;
		gap: 0.5em;
		margin: 1em 0;
		padding: 0;
		font-size: 1em;
	}

	.query {
		flex: 1;
		margin: 0;
	}

	.sections {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5em;
		margin-bottom: 1.5em;
	}

	.section-pill {
		padding: 0.3em 0.8em;
		border: 1px solid var(--neutral_light);
		border-radius: 1em;
		background: none;
		color: var(--neutral);
		font-size: 0.85em;
		cursor: pointer;

		&.active {
			border-color: var(--purple_bright);
			background: var(--purple_bright);
			color: var(--purple_bright_text);
		}
	}

	.group {
		margin-bottom: 1.5em;

	& h2 {
		margin-bottom: 0.5em;
		color: var(--neutral);
		font-size: 0.9em;
		letter-spacing: 0.03em;
		text-transform: uppercase;
	}
	}

	.results {
		margin: 0;
		padding: 0;
		list-style: none;

		& li {
			margin: 0;
			padding: 0;
		}
	}

	.result {
		display: flex;
		align-items: center;
		gap: 0.75em;
		padding: 0.6em 0.75em;
		border-radius: 0.35em;
		color: inherit;
		text-decoration: none;

		&:hover {
			background: color-mix(in oklch, var(--purple_bright) 10%, var(--transparent));
		}

		&.archived {
			opacity: 0.5;
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
		font-size: 0.85em;
	}

	.tag-archived {
		flex-shrink: 0;
		padding: 0.15em 0.6em;
		border: 1px solid var(--red);
		border-radius: 1em;
		color: var(--red);
		font-size: 0.7em;
		letter-spacing: 0.03em;
		text-transform: uppercase;
	}

	.hint {
		color: var(--neutral);
	}
</style>
