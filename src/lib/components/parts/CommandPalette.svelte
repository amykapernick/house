<script lang="ts">
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { addDays, format, isToday, isTomorrow, parseISO } from 'date-fns';
	import { DATE_FORMATS } from '$utils/dateFormats';
	import { SvelteMap, SvelteURLSearchParams } from 'svelte/reactivity';
	import fetchClientData, { clearCache, getGraphqlUrl } from '$utils/fetchClientData';
	import { getRecentPages } from '$utils/recentPages';
	import { CONTENT_CACHE_TTL, contentEntriesQuery, contentIndexQuery } from '$utils/content';
	import { getDiscoverableRoutes, flattenPages } from '$utils/routes';
	import fetchTasksData from '$utils/tasksData';
	import { parseDeepSearch, type SearchSection } from '$utils/commandPaletteSearch';
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
	import { getToken } from '$lib/auth';
	import { routeRequiresAuth } from '$lib/navigation';
	import type { MenuItem } from '$types/global';
	import RecipeIcon from '$img/icons/recipe-book-47.svg?component';
	import ContentIcon from './ContentIcon.svelte';

	let {
		menuItems,
		isAuthenticated,
		open = $bindable(false),
		class: className = '',
	}: {
		menuItems: MenuItem[];
		isAuthenticated: boolean;
		open?: boolean;
		class?: string;
	} = $props();

	type PlannedMeal = { date: string; entryType: string };
	type QuickAddType = `task` | `shop`;

	const QUICK_ADD_LABELS: Record<QuickAddType, { hint: string; success: string; error: string; mutation: string }> = {
		task: {
			hint: `Add a task to the Home project · optional "| due date" e.g. "tomorrow 5pm"`,
			success: `Task added`,
			error: `Failed to add task.`,
			mutation: `createTask`,
		},
		shop: {
			hint: `Add an item to the shopping list`,
			success: `Added to shopping list`,
			error: `Failed to add item.`,
			mutation: `createShoppingItem`,
		},
	};

	const RECIPE_MIN_CHARS = 2;
	const RECIPE_DEBOUNCE_MS = 250;
	const RECIPE_FETCH_COUNT = 15; // fetched so upcoming meal-plan matches outside the top few can still surface
	const RECIPE_DISPLAY_LIMIT = 5;
	const MEAL_PLAN_LOOKAHEAD_DAYS = 7;
	const SECTION_DISPLAY_LIMIT = 5;

	let dialogEl: HTMLDialogElement | undefined = $state();
	let inputEl: HTMLInputElement | undefined = $state();
	let resultsEl: HTMLUListElement | undefined = $state();
	let query = $state(``);
	let activeIndex = $state(0);
	let recentLinks = $state<string[]>([]);
	let recipeResults = $state<Result[]>([]);
	let recipesLoading = $state(false);
	// Not in the main nav (kept out of everyday browsing), but small enough to
	// hold client-side and filter locally rather than a live per-keystroke
	// search like recipes get. Generic over every /content/{slug} entry (e.g.
	// Possums), not any one entry in particular - a new entry in Notion's App
	// Content database shows up here with no code change.
	let contentEntries = $state<ContentEntryResult[]>([]);
	let contentPages = $state<ContentPageResult[]>([]);
	let upcomingMealPlan = new SvelteMap<string, PlannedMeal>();
	// Raw data for the `/s`-gated sections - each fetched/cached under the exact
	// same cacheKey + query its own page uses, so the cache is shared rather than
	// a second, differently-shaped entry fighting over the same key.
	let resources = $state<any[]>([]);
	let suppliers = $state<any[]>([]);
	let assets = $state<any[]>([]);
	let smallHuman = $state<any>(null);
	let searchTasks = $state<any[]>([]);
	let shoppingListItems = $state<any[]>([]);
	let budgetItems = $state<any[]>([]);
	let scheduleEvents = $state<any[]>([]);
	let icsEvents = $state<any[]>([]);
	let quickAddSubmitting = $state(false);
	let quickAddError = $state(``);
	let quickAddSuccess = $state(``);

	const quickAddMatch = $derived.by(() => {
		const match = /^\/(task|shop)\b\s*(.*)$/is.exec(query.trimStart());
		if (!match) return null;
		const type = match[1].toLowerCase() as QuickAddType;
		const rest = match[2];

		if (type === `task`) {
			// "Buy milk | tomorrow 5pm" - everything after the first "|" is a
			// natural-language due date/time, parsed server-side by Todoist.
			const pipeIndex = rest.indexOf(`|`);
			const content = (pipeIndex === -1 ? rest : rest.slice(0, pipeIndex)).trim();
			const due = pipeIndex === -1 ? undefined : rest.slice(pipeIndex + 1).trim() || undefined;
			return { type, content, due };
		}

		return { type, content: rest.trim(), due: undefined };
	});

	// File-system routes never linked from the header nav (e.g. /reference/house,
	// only reachable by following a link within /reference) - static per session,
	// so computed once rather than re-derived on every render.
	const discoveredRoutes = getDiscoverableRoutes();

	const navPages = $derived(flattenPages(menuItems, isAuthenticated));

	const orphanPages = $derived<Result[]>(
		discoveredRoutes
			.filter((route) => isAuthenticated || !routeRequiresAuth(route.path))
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

	// `/s query` or `/s /token query` - see SCOPE_TOKENS above. Only recognised
	// when it's the very start of the query, so it never shadows the plain
	// `/task`/`/shop` quick-add commands (those match position 0 directly).
	const deepSearchMatch = $derived(parseDeepSearch(query));

	const term = $derived(quickAddMatch || deepSearchMatch ? `` : query.trim().toLowerCase());

	// The search term a given section should filter by right now, or null if it
	// shouldn't be searched at all. Pages/Recipes/Content search on plain typing
	// (legacy behaviour, unchanged); every other section only searches under `/s`.
	function sectionTerm(section: Result[`section`]): string | null {
		if (deepSearchMatch) {
			return !deepSearchMatch.scope || deepSearchMatch.scope === section ? deepSearchMatch.term : null;
		}
		return section === `Pages` || section === `Recipes` || section === `Content` ? term || null : null;
	}

	const recentResults = $derived(
		term || deepSearchMatch
			? []
			: recentLinks
					.map((link) => pages.find((page) => page.link === link))
					.filter((page): page is Result => !!page)
					.map((page) => ({ ...page, key: `recent:${page.link}`, section: `Recent` as const })),
	);

	const pageResults = $derived.by(() => {
		const t = sectionTerm(`Pages`);
		if (t) return pages.filter((page) => page.label.toLowerCase().includes(t));
		return deepSearchMatch ? [] : pages.filter((page) => !recentLinks.includes(page.link));
	});

	// Deliberately left out of the main nav/`pages` list - only surfaces here
	// once you search for it, rather than an always-visible section.
	const contentResults = $derived(buildContentResults(contentEntries, contentPages, sectionTerm(`Content`) ?? ``));

	// `/s`-gated sections below - raw data is fetched once when the palette opens
	// (see loadDeepSearchData) and shaped/filtered by the shared builders in
	// $utils/searchResults (also used, unlimited, by the /search page).
	const referenceResults = $derived(buildReferenceResults(resources, sectionTerm(`References`) ?? ``, SECTION_DISPLAY_LIMIT));
	const supplierResults = $derived(buildSupplierResults(suppliers, sectionTerm(`Suppliers`) ?? ``, SECTION_DISPLAY_LIMIT));
	const assetResults = $derived(buildAssetResults(assets, sectionTerm(`Assets`) ?? ``, SECTION_DISPLAY_LIMIT));
	const smallHumanResults = $derived(buildSmallHumanResults(smallHuman, sectionTerm(`Small Human`) ?? ``, SECTION_DISPLAY_LIMIT));
	const taskResults = $derived(buildTaskResults(searchTasks, sectionTerm(`Tasks`) ?? ``, SECTION_DISPLAY_LIMIT));
	const shoppingListResults = $derived(buildShoppingListResults(shoppingListItems, sectionTerm(`Shopping List`) ?? ``, SECTION_DISPLAY_LIMIT));
	const budgetResults = $derived(buildBudgetResults(budgetItems, sectionTerm(`Budget`) ?? ``, SECTION_DISPLAY_LIMIT));
	const scheduleResults = $derived(buildScheduleResults(scheduleEvents, icsEvents, sectionTerm(`Schedule`) ?? ``, SECTION_DISPLAY_LIMIT));

	const results = $derived([...recentResults, ...pageResults, ...contentResults, ...recipeResults, ...referenceResults, ...supplierResults, ...assetResults, ...smallHumanResults, ...taskResults, ...shoppingListResults, ...budgetResults, ...scheduleResults]);

	// Every section here is capped at SECTION_DISPLAY_LIMIT (or, for recipes,
	// RECIPE_DISPLAY_LIMIT) - this links to the unlimited /search page for the
	// same term/scope so a busy query isn't stuck at "top 5 per section".
	const viewAllHref = $derived.by(() => {
		const searchTerm = deepSearchMatch ? deepSearchMatch.term : term;
		if (!searchTerm) return null;
		const params = new SvelteURLSearchParams({ q: searchTerm });
		if (deepSearchMatch?.scope) params.set(`section`, deepSearchMatch.scope);
		return `${resolve(`/search`)}?${params.toString()}`;
	});

	function escapeGqlString(value: string): string {
		return value.replace(/\\/g, `\\\\`).replace(/"/g, `\\"`);
	}

	function applyMealPlanResult(res: any) {
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

	async function loadUpcomingMealPlan() {
		if (!isAuthenticated) return;
		const start = format(new Date(), DATE_FORMATS.iso);
		const end = format(addDays(new Date(), MEAL_PLAN_LOOKAHEAD_DAYS), DATE_FORMATS.iso);
		const res = await fetchClientData({
			cacheKey: `mealplan-upcoming-${start}`,
			onStale: applyMealPlanResult,
			gqlQuery: `
				query {
					mealPlanByDay(startDate: "${start}", endDate: "${end}") {
						date
						entries { entryType recipe { slug } }
					}
				}
			`,
		});
		applyMealPlanResult(res);
	}

	async function loadContentEntries() {
		if (!isAuthenticated) return;

		// Short-lived (default TTL), shared cache key with the /content pages -
		// Notion's uploaded-file icon URLs expire after about an hour.
		const res = await fetchClientData({
			cacheKey: `content-entries`,
			gqlQuery: contentEntriesQuery,
		});
		contentEntries = res.contentEntries ?? [];

		// Small, static-ish list (currently just one entry) - cheap enough to
		// eagerly pull every entry's own index too, so its subpages are
		// search-able here as well. Long-lived, same cache key the /content
		// pages use, so visiting a page and searching for it share one fetch.
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
	}

	// `/s`-gated sections (see deepSearchMatch/sectionTerm) - each fetch reuses
	// the *exact* cacheKey and query its own page runs, so the shared localStorage
	// cache entry stays one consistent shape rather than two calls racing to
	// overwrite it with different field sets.
	async function loadDeepSearchData() {
		if (!isAuthenticated) return;

		fetchClientData({
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

		fetchClientData({
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

		fetchClientData({
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

		fetchClientData({
			cacheKey: `small-human`,
			onStale: (res) => {
				smallHuman = res.smallHuman ?? null;
			},
			gqlQuery: `
				query {
					smallHuman {
						overview { last_updated age_weeks age_months birth_month }
						alerts(orderBy: urgency) { id level title detail }
						growth {
							last_updated check_frequency note trend_notes
							measurements { date height { value percentile unit } weight { value percentile unit } head { value percentile unit } }
						}
						feeding {
							last_updated check_frequency
							details { label value }
							schedule {
								source note
								stages { id title expected_age breastfeeds { value unit note } solid_meals { value unit note } water { value unit note } upcoming }
								upcoming
							}
							sources
							principles {
								note core_philosophy
								current_and_ongoing { id title detail sources }
								toddler_forward_look { id title detail sources }
								sources
							}
						}
						teeth {
							last_updated check_frequency note possums_note teething_now teething_note
							teeth { fdi name status erupted_date erupted_age_months expected_months sources }
							dental_care { toothbrush toothpaste note todoist_task { id name status due link } sources }
						}
						swimming { last_updated check_frequency skills { id title status detail } note sources }
						milestones { last_updated check_frequency note items { id category title status detail achieved_date expected_weeks expected_months sources } }
						auslan { last_updated check_frequency note sources signs { id name status tip reference { url video note } } }
						sleep {
							last_updated check_frequency framework
							current_pattern {
								naps nap_transition nap_duration_range_min nap_duration_range_max
								nap_duration_typical total_daytime_sleep_approx nap_cap nap_cutoff bedtime typical_wake
								night_waking_pattern suspected_cause note
							}
							items { id title status detail tag sources }
							environment {
								note
								bedroom_temp_pattern { bedtime_temp early_morning_temp swing_note }
								tog_reference { temp_range_c tog layer }
								current_recommendation { challenge strategy recommended_setup { sleep_sack_tog pj_layer reasoning } sources }
								current_sizes sleep_sacks_on_hand { tog sizes material note } size_watch
							}
						}
						clothing {
							seasonal {
								note current_sizes current_sizes_note
								noongar_season { current current_period current_description next next_period next_description weeks_until_next }
								alerts { id type title detail action weeks_ahead }
							}
							daytime {
								note layer_rule feet_rule
								sun_safety { uv_threshold_for_coverage note sources }
								indoor_reference { indoor_temp_c_min indoor_temp_c_max recommendation layers }
								outdoor_reference { feels_like_c_min feels_like_c_max recommendation layers extras }
								rain_suit { recommended trigger note }
								current_recommendation {
									generated_from_temp generated_from_feels_like last_updated
									indoor { summary layers { position type sleeve weight material } feet extras { hat hat_reason beanie mittens sunscreen sunscreen_reason } rain_suit }
									outdoor { summary layers { position type sleeve weight material } feet extras { hat hat_reason beanie mittens sunscreen sunscreen_reason } rain_suit }
								}
								forecast {
									date day_label temp feels_like_high_c feels_like_low_c
									conditions rain_expected uv_index
									indoor { summary layers { position type sleeve weight material } feet extras { hat hat_reason beanie mittens sunscreen sunscreen_reason } rain_suit }
									outdoor { summary layers { position type sleeve weight material } feet extras { hat hat_reason beanie mittens sunscreen sunscreen_reason } rain_suit }
								}
							}
						}
						vaccinations { note items(orderBy: due_date) { id title status detail date next_due todoist_task { id name status due link } } sources }
						notes {
							__typename
							... on CarSeat { name last_updated check_frequency current_stage facing facing_note next_transition sources }
							... on ParentingApproachNote { name parentingApproachItems: items { id title detail sources } }
							... on ToddlerSleepPrepNote {
								name
								toddlerSleepPrepDetail: items { note trigger_age_weeks status alert_when_due { id level title detail } reading { id title note sources } sources }
							}
						}
						activities { id title status detail sources }
						sources { id name badge url detail priority approved note }
					}
				}
			`,
		}).then((res) => {
			smallHuman = res.smallHuman ?? null;
		});

		fetchTasksData().then((tasks) => {
			searchTasks = tasks;
		});

		fetchClientData({
			cacheKey: `shopping-list`,
			onStale: (res) => {
				shoppingListItems = res.shoppingList?.items ?? [];
			},
			gqlQuery: `
				query {
					shoppingList {
						items { id display checked quantity note category labels source link recipes { id name slug } }
						storeGroups {
							name
							items { id display checked quantity note category labels source link recipes { id name slug } }
							subGroups { name items { id display checked quantity note category labels source link recipes { id name slug } } }
						}
					}
				}
			`,
		}).then((res) => {
			shoppingListItems = res.shoppingList?.items ?? [];
		});

		fetchClientData({
			cacheKey: `budget`,
			onStale: (res) => {
				budgetItems = res.budget ?? [];
			},
			gqlQuery: `
				query {
					budget { id description amount period monthlyAmount income bucket { id name } tags note }
					budgetBuckets { id name percentage percentageGoal items { id monthlyAmount income } }
				}
			`,
		}).then((res) => {
			budgetItems = res.budget ?? [];
		});

		fetchClientData({
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

		fetchClientData({
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

	const recipeSearchTerm = $derived(sectionTerm(`Recipes`) ?? ``);

	$effect(() => {
		const searchTerm = recipeSearchTerm;
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
			quickAddSubmitting = false;
			quickAddError = ``;
			quickAddSuccess = ``;
			loadUpcomingMealPlan();
			loadContentEntries();
			deepSearchDataLoaded = false;
			dialogEl.showModal();
			inputEl?.focus();
		}
		if (!open && dialogEl.open) dialogEl.close();
	});

	// Deliberately lazy, unlike loadUpcomingMealPlan/loadContentEntries above -
	// these 6 queries (one of them the full smallHuman tree) are only worth
	// their network/backend cost once someone actually types `/s`, not on every
	// Cmd+K open. Fires once per dialog session, the first time deepSearchMatch
	// goes truthy.
	let deepSearchDataLoaded = false;

	$effect(() => {
		if (deepSearchMatch && !deepSearchDataLoaded) {
			deepSearchDataLoaded = true;
			loadDeepSearchData();
		}
	});

	async function submitQuickAdd() {
		const match = quickAddMatch;
		if (!match || !match.content || quickAddSubmitting) return;

		quickAddSubmitting = true;
		quickAddError = ``;
		quickAddSuccess = ``;

		const labels = QUICK_ADD_LABELS[match.type];
		const mutation = match.type === `task` ? `mutation { createTask(content: ${JSON.stringify(match.content)}${match.due ? `, due: ${JSON.stringify(match.due)}` : ``}) { success } }` : `mutation { createShoppingItem(note: ${JSON.stringify(match.content)}, source: "todoist") { success } }`;

		const token = await getToken();
		const res = await fetch(getGraphqlUrl(), {
			method: `POST`,
			headers: {
				'Content-Type': `application/json`,
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
			body: JSON.stringify({ query: mutation }),
		}).then((r) => r.json());

		quickAddSubmitting = false;

		if (res?.errors || !res?.data?.[labels.mutation]?.success) {
			quickAddError = labels.error;
			return;
		}

		clearCache(match.type === `task` ? `tasks-${format(new Date(), DATE_FORMATS.iso)}` : `shopping-list`);

		quickAddSuccess = labels.success;
		query = `/${match.type} `;
	}

	function handleKeydown(event: KeyboardEvent) {
		// Ctrl/Cmd+Enter jumps straight to the /search page for the current
		// query (same destination as the footer's "View all results" link) -
		// viewAllHref is null in quick-add mode (no search term then), so this
		// is a no-op there rather than conflicting with quick-add's own Enter.
		if ((event.ctrlKey || event.metaKey) && event.key === `Enter` && viewAllHref) {
			event.preventDefault();
			// eslint-disable-next-line svelte/no-navigation-without-resolve -- viewAllHref is resolve()'d with a query string appended, same as the <a> above
			goto(viewAllHref);
			open = false;
			return;
		}

		if (quickAddMatch) {
			if (event.key === `Enter`) {
				event.preventDefault();
				submitQuickAdd();
			}
			return;
		}

		if (event.key === `ArrowDown`) {
			event.preventDefault();
			activeIndex = Math.min(activeIndex + 1, results.length - 1);
		} else if (event.key === `ArrowUp`) {
			event.preventDefault();
			activeIndex = Math.max(activeIndex - 1, 0);
		} else if (event.key === `Enter`) {
			event.preventDefault();
			// Delegates to the active <a>'s own click rather than duplicating
			// navigation logic - handles internal SvelteKit routing and external
			// target="_blank" links identically to an actual mouse click.
			resultsEl?.querySelector<HTMLAnchorElement>(`[data-active='true']`)?.click();
		}
	}
</script>

<dialog
	bind:this={dialogEl}
	class="palette {className}"
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
		placeholder="Go to a page, search recipes, /task /shop to add, or /s to search everything..."
		aria-label="Search pages and recipes, /task or /shop to quickly add, or /s to search everything"
		autocomplete="off"
		onkeydown={handleKeydown}
		oninput={() => {
			quickAddError = ``;
			quickAddSuccess = ``;
		}}
	/>
	{#if quickAddMatch}
		{@const labels = QUICK_ADD_LABELS[quickAddMatch.type]}
		<div class="quick-add">
			<p class="quick-add-hint">{labels.hint}</p>
			{#if quickAddSuccess}<p class="quick-add-status success">{quickAddSuccess}</p>{/if}
			{#if quickAddError}<p class="quick-add-status error">{quickAddError}</p>{/if}
		</div>
	{:else}
		<ul
			class="results"
			bind:this={resultsEl}
		>
			{#each results as result, i (result.key)}
				<li>
					<!-- result.link is already resolve()d (internal) or a raw external/mailto/tel URL (References/Suppliers/Assets/Tasks) above -->
					<!-- eslint-disable svelte/no-navigation-without-resolve -->
					<a
						class="result"
						class:archived={result.archived}
						href={result.link}
						target={result.link.startsWith(`http`) ? `_blank` : undefined}
						rel={result.link.startsWith(`http`) ? `noreferrer` : undefined}
						data-active={i === activeIndex}
						onmouseenter={() => (activeIndex = i)}
						onclick={() => (open = false)}
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
						{#if result.archived}<span class="tag tag-archived">Archived</span>{/if}
						<span class="tag">{result.section}</span>
					</a>
					<!-- eslint-enable svelte/no-navigation-without-resolve -->
				</li>
			{/each}
			{#if recipeSearchTerm.length >= RECIPE_MIN_CHARS && recipesLoading && recipeResults.length === 0}
				<li class="hint">Searching recipes...</li>
			{/if}
			{#if results.length === 0 && !recipesLoading}
				<li class="hint">
					{#if deepSearchMatch}
						No matches{deepSearchMatch.scope ? ` in ${deepSearchMatch.scope}` : ``}
					{:else}
						No matching pages or recipes
					{/if}
				</li>
			{/if}
		</ul>
	{/if}
	<footer class="footer">
		{#if quickAddMatch}
			<span><kbd>&crarr;</kbd> {quickAddSubmitting ? `adding…` : `add`}</span>
			<span><kbd>esc</kbd> close</span>
		{:else}
			<span><kbd>&uarr;</kbd><kbd>&darr;</kbd> navigate</span>
			<span><kbd>&crarr;</kbd> select</span>
			<span><kbd>esc</kbd> close</span>
			{#if !term && !deepSearchMatch}
				<span class="quick-add-tip"><kbd>/task</kbd> <kbd>/shop</kbd> quick add · <kbd>/s</kbd> search everything</span>
			{:else}
				{#if deepSearchMatch?.scope}
					<span class="quick-add-tip">searching {deepSearchMatch.scope}</span>
				{/if}
				{#if viewAllHref}
					<!-- eslint-disable svelte/no-navigation-without-resolve -- resolve()'d base with a query string appended, same pattern as Result.link above -->
					<a
						class="view-all"
						href={viewAllHref}
						onclick={() => (open = false)}
					>
						<kbd>ctrl</kbd>+<kbd>&crarr;</kbd> view all results &rarr;
					</a>
					<!-- eslint-enable svelte/no-navigation-without-resolve -->
				{/if}
			{/if}
		{/if}
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
		overflow: hidden;
		transform: translateX(-50%);
		border: none;
		border-radius: 0.5em;
		background: var(--background);
		box-shadow: 0 5px 30px color-mix(in oklch, var(--neutral) 30%, var(--transparent));
		color: var(--background_text);

		&::backdrop {
			background: color-mix(in oklch, var(--neutral) 60%, var(--transparent));
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
		max-height: 50vh;
		margin: 0;
		padding: 0.5em;
		overflow-y: auto;
		list-style: none;

		& li {
			margin: 0;
			padding: 0;
		}
	}

	.quick-add {
		padding: 0.75em;
	}

	.quick-add-hint {
		margin: 0;
		color: var(--neutral);
		font-size: 0.9em;
	}

	.quick-add-status {
		margin: 0.5em 0 0;
		font-size: 0.9em;

		&.success {
			color: var(--green);
		}

		&.error {
			color: var(--red);
		}
	}

	.quick-add-tip {
		margin-left: auto;
	}

	.view-all {
		margin-left: auto;
		color: var(--purple_bright);
		text-decoration: none;

		&:hover {
			text-decoration: underline;
		}
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
		text-decoration: none;
		cursor: pointer;

		&[data-active='true'] {
			background: var(--purple_bright);
			color: var(--purple_bright_text);

			& .tag {
				border-color: currentColor;
				color: inherit;
			}
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
		font-size: 0.8em;
	}

	.tag {
		flex-shrink: 0;
		padding: 0.15em 0.6em;
		border: 1px solid var(--neutral_light);
		border-radius: 1em;
		color: var(--neutral);
		font-size: 0.7em;
		letter-spacing: 0.03em;
		text-transform: uppercase;
	}

	.tag-archived {
		border-color: var(--red);
		color: var(--red);
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
