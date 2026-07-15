<script lang="ts">
	import { isAuthenticated, getToken } from '$lib/auth';
	import fetchClientData, { setCache, getGraphqlUrl } from '$utils/fetchClientData';
	import { resolve } from '$app/paths';
	import { SvelteSet } from 'svelte/reactivity';
	import CheckboxButton from '$parts/CheckboxButton.svelte';
	import { getPageTitle } from '$utils/pageTitle';

	type SubGroup = { name: string; items: any[] };
	type StoreGroup = { name: string; items: any[]; subGroups: SubGroup[] };

	let items = $state<any[]>([]);
	let storeGroups = $state<StoreGroup[]>([]);
	let loading = $state(true);
	let showChecked = $state(false);
	let checking = new SvelteSet<string>();
	let newItemText = $state('');
	let adding = $state(false);
	let addError = $state('');

	function fetchList(skipCache = false) {
		loading = true;
		function handleList(res: any) {
			items = res.shoppingList?.items ?? [];
			storeGroups = res.shoppingList?.storeGroups ?? [];
			loading = false;
		}
		fetchClientData({
			cacheKey: 'shopping-list',
			skipCache,
			onStale: handleList,
			gqlQuery: `
				query {
					shoppingList {
						items {
							id display checked quantity note
							category labels source link
							recipes { id name slug }
						}
						storeGroups {
							name
							items { id display checked quantity note category labels source link recipes { id name slug } }
							subGroups {
								name
								items { id display checked quantity note category labels source link recipes { id name slug } }
							}
						}
					}
				}
			`,
		}).then(handleList);
	}

	$effect(() => {
		if ($isAuthenticated) {
			fetchList();
		}
	});

	async function addItem() {
		const note = newItemText.trim();
		if (!note) return;

		adding = true;
		addError = '';

		const token = await getToken();
		const res = await fetch(getGraphqlUrl(), {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...(token ? { 'Authorization': `Bearer ${token}` } : {}),
			},
			body: JSON.stringify({
				query: `mutation { createShoppingItem(note: ${JSON.stringify(note)}) { success } }`,
			}),
		}).then(r => r.json());

		adding = false;

		if (res?.errors || !res?.data?.createShoppingItem?.success) {
			addError = 'Failed to add item.';
			return;
		}

		newItemText = '';
		fetchList(true);
	}

	async function toggleItem(item: any) {
		const newChecked = !item.checked;
		checking.add(item.id);

		const token = await getToken();
		const res = await fetch(getGraphqlUrl(), {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...(token ? { 'Authorization': `Bearer ${token}` } : {}),
			},
			body: JSON.stringify({
				query: `mutation { checkShoppingItem(itemId: "${item.id}", source: "${item.source}", checked: ${newChecked}) { success } }`,
			}),
		}).then(r => r.json());

		checking.delete(item.id);

		if (res?.errors || !res?.data?.checkShoppingItem?.success) return;

		items = items.map(i =>
			i.id === item.id ? { ...i, checked: newChecked } : i
		);
		storeGroups = storeGroups.map((store) => ({
			...store,
			items: store.items.map((i) => (i.id === item.id ? { ...i, checked: newChecked } : i)),
			subGroups: store.subGroups.map((sub) => ({
				...sub,
				items: sub.items.map((i) => (i.id === item.id ? { ...i, checked: newChecked } : i)),
			})),
		}));

		// Keep the shared cache in sync so a revisit within the TTL (or another
		// device/tab reading the same cache key) doesn't show the pre-toggle state.
		setCache('shopping-list', { shoppingList: { items, storeGroups } });
	}

	let uncheckedItems = $derived(items.filter(i => !i.checked));
	let checkedItems = $derived(items.filter(i => i.checked));

	function sentenceCase(str: string) {
		return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
	}

	// The store grouping itself comes from the API - this just hides checked
	// items (and drops any group/sub-group that's now empty) when the toggle is off.
	let visibleStoreGroups = $derived.by((): StoreGroup[] => {
		const filterItems = (list: any[]) => (showChecked ? list : list.filter((i) => !i.checked));

		return storeGroups
			.map((store) => ({
				name: store.name,
				items: filterItems(store.items),
				subGroups: store.subGroups
					.map((sub) => ({ name: sub.name, items: filterItems(sub.items) }))
					.filter((sub) => sub.items.length > 0),
			}))
			.filter((store) => store.items.length > 0 || store.subGroups.length > 0);
	});
</script>

<svelte:head>
	<title>{getPageTitle(`Shopping List`)}</title>
</svelte:head>

<h1>Shopping List</h1>

<form class="quick-add" onsubmit={(e) => { e.preventDefault(); addItem(); }}>
	<input
		type="text"
		placeholder="Add an item..."
		bind:value={newItemText}
		disabled={adding}
		aria-label="Add an item to the shopping list"
	/>
	<button type="submit" disabled={adding || !newItemText.trim()}>{adding ? 'Adding…' : 'Add'}</button>
</form>
{#if addError}<p class="error">{addError}</p>{/if}

{#if loading}
	<p>Loading...</p>
{:else if items.length === 0}
	<p>Shopping list is empty.</p>
{:else}
	<div class="controls">
		<p class="count">{uncheckedItems.length} items to get</p>
		<label class="toggle">
			<input type="checkbox" bind:checked={showChecked} />
			Show checked items ({checkedItems.length})
		</label>
	</div>

	{#each visibleStoreGroups as store (store.name)}
		<details class="store" open>
			<summary><h2>{sentenceCase(store.name)}</h2></summary>

			{#if store.items.length}
				<ul>
					{#each store.items as item (item.id)}
						{@render itemRow(item)}
					{/each}
				</ul>
			{/if}

			{#each store.subGroups as sub (sub.name)}
				<details class="sub-group" open>
					<summary><h3>{sub.name}</h3></summary>
					<ul>
						{#each sub.items as item (item.id)}
							{@render itemRow(item)}
						{/each}
					</ul>
				</details>
			{/each}
		</details>
	{/each}
{/if}

{#snippet itemRow(item: any)}
	<li class:checked={item.checked}>
		<CheckboxButton
			class="check-btn"
			variant="boxed"
			state={item.checked ? 'complete' : 'incomplete'}
			loading={checking.has(item.id)}
			onclick={() => toggleItem(item)}
			label={item.checked ? 'Uncheck item' : 'Check item'}
		/>
		<span class="item-row">
			<span class="item-display">
				{item.display}
			</span>
			{#if item.recipes?.length}
				<span class="item-recipes">
					{#each item.recipes as recipe (recipe.id)}
						<a href={resolve(`/recipes/[slug]`, { slug: recipe.slug })} class="recipe-tag">{recipe.name}</a>
					{/each}
				</span>
			{/if}
		</span>
	</li>
{/snippet}

<style>
	@import '@mixins';

	.quick-add {
		display: flex;
		gap: 0.5em;
		margin-bottom: 1em;

		& input {
			flex: 1;
			padding: 0.5em 0.75em;
			border: 1px solid var(--grey_light);
			border-radius: 0.3em;
			font-size: 0.95em;
		}

		& button {
			padding: 0.5em 1em;
			border: none;
			border-radius: 0.3em;
			background: var(--purple_bright);
			color: var(--purple_bright_text);
			cursor: pointer;
			font-size: 0.95em;

			&:disabled {
				opacity: 0.5;
				cursor: wait;
			}
		}
	}

	.error {
		color: var(--red);
		margin: 0 0 1em;
	}

	.controls {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5em;
	}

	.count {
		font-size: 0.9em;
		color: var(--grey);
		margin: 0;
	}

	.toggle {
		display: flex;
		align-items: center;
		gap: 0.4em;
		font-size: 0.85em;
		color: var(--grey);
		cursor: pointer;

		& input {
			cursor: pointer;
		}
	}

	.store {
		margin-bottom: 1.5em;

		& > summary {
			cursor: pointer;
			list-style: none;

			&::marker,
			&::-webkit-details-marker {
				display: none;
			}

			& h2 {
				font-size: 1.1em;
				margin: 0;
				padding-bottom: 0.3em;
				border-bottom: 2px solid var(--navy);
				display: flex;
				align-items: center;
				gap: 0.5em;

				&::before {
					content: '▸';
					transition: transform 0.15s;
				}
			}
		}

		&[open] > summary h2::before {
			transform: rotate(90deg);
		}
	}

	.sub-group {
		margin: 0.5em 0 0.5em 1em;

		& > summary {
			cursor: pointer;
			list-style: none;

			&::marker,
			&::-webkit-details-marker {
				display: none;
			}

			& h3 {
				font-size: 0.95em;
				margin: 0;
				padding-bottom: 0.2em;
				border-bottom: 1px solid var(--grey_light);
				color: var(--navy);
				text-transform: capitalize;
				display: flex;
				align-items: center;
				gap: 0.5em;

				&::before {
					content: '▸';
					font-size: 0.8em;
					transition: transform 0.15s;
				}
			}
		}

		&[open] > summary h3::before {
			transform: rotate(90deg);
		}
	}

	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		display: flex;
		align-items: center;
		gap: 0.5em;
		padding: 0.5em 0.3em;
		border-bottom: 1px solid color-mix(in srgb, var(--grey_light) 50%, transparent);

		&.checked {
			opacity: 0.4;

			& .item-display {
				text-decoration: line-through;
			}
		}
	}

	:global(.check-btn) {
		flex-shrink: 0;
	}

	.item-row {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.3em;
	}

	.item-recipes {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4em;
	}

	.recipe-tag {
		padding: 0.1em 0.5em;
		border: 1px solid currentColor;
		border-radius: 0.2em;
		font-size: 0.75em;
		color: var(--purple_bright);
		text-decoration: none;

		&:hover {
			text-decoration: underline;
		}
	}
</style>
