<script lang="ts">
	import { isAuthenticated, getToken } from '$lib/auth';
	import fetchClientData from '$utils/fetchClientData';
	import { SvelteSet } from 'svelte/reactivity';

	let items = $state<any[]>([]);
	let loading = $state(true);
	let showChecked = $state(false);
	let checking = new SvelteSet<string>();

	function fetchList(skipCache = false) {
		loading = true;
		function handleList(res: any) {
			items = res.shoppingList?.items ?? [];
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

	async function toggleItem(item: any) {
		const newChecked = !item.checked;
		checking.add(item.id);

		const token = await getToken();
		await fetch('/api/graphql', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...(token ? { 'Authorization': `Bearer ${token}` } : {}),
			},
			body: JSON.stringify({
				query: `mutation { checkShoppingItem(itemId: "${item.id}", source: "${item.source}", checked: ${newChecked}) { success } }`,
			}),
		}).then(r => r.json());

		items = items.map(i =>
			i.id === item.id ? { ...i, checked: newChecked } : i
		);

		checking.delete(item.id);
	}

	let uncheckedItems = $derived(items.filter(i => !i.checked));
	let checkedItems = $derived(items.filter(i => i.checked));

	function sentenceCase(str: string) {
		return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
	}

	type SubGroup = { name: string; items: any[] };
	type StoreGroup = { name: string; items: any[]; subGroups: SubGroup[] };

	let storeGroups = $derived.by((): StoreGroup[] => {
		const source = showChecked ? items : uncheckedItems;
		const stores: Record<string, { items: any[]; subGroups: Record<string, any[]> }> = {};

		function ensureStore(name: string) {
			if (!stores[name]) stores[name] = { items: [], subGroups: {} };
		}

		for (const item of source) {
			if (item.source === 'mealie') {
				ensureStore('Groceries');
				if (item.category) {
					if (!stores['Groceries'].subGroups[item.category]) {
						stores['Groceries'].subGroups[item.category] = [];
					}
					stores['Groceries'].subGroups[item.category].push(item);
				} else {
					stores['Groceries'].items.push(item);
				}
			} else {
				const storeLabels = item.labels?.length ? item.labels : ['Groceries'];
				for (const store of storeLabels) {
					ensureStore(store);
					stores[store].items.push(item);
				}
			}
		}

		return Object.entries(stores)
			.map(([name, data]) => ({
				name,
				items: data.items,
				subGroups: Object.entries(data.subGroups)
					.map(([subName, subItems]) => ({ name: subName, items: subItems }))
					.sort((a, b) => a.name.localeCompare(b.name)),
			}))
			.sort((a, b) => {
				if (a.name === 'Groceries') return 1;
				if (b.name === 'Groceries') return -1;
				return a.name.localeCompare(b.name);
			});
	});
</script>

<svelte:head>
	<title>Shopping List | Kapers Crewe Household</title>
</svelte:head>

<h1>Shopping List</h1>

{#if loading}
	<p>Loading...</p>
{:else if items.length === 0}
	<p>Shopping list is empty.</p>
{:else}
	<div class="controls">
		<p class="count">{uncheckedItems.length} items to get</p>
		<button class="refresh" onclick={() => fetchList(true)}>Refresh</button>
		<label class="toggle">
			<input type="checkbox" bind:checked={showChecked} />
			Show checked items ({checkedItems.length})
		</label>
	</div>

	{#each storeGroups as store (store.name)}
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
		<button
			class="check-btn"
			class:is-checked={item.checked}
			disabled={checking.has(item.id)}
			onclick={() => toggleItem(item)}
			aria-label={item.checked ? 'Uncheck item' : 'Check item'}
		>
			{#if checking.has(item.id)}
				…
			{:else if item.checked}
				✓
			{/if}
		</button>
		<span class="item-display">
			{item.display}
		</span>
	</li>
{/snippet}

<style>
	@import '@mixins';

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

	.refresh {
		padding: 0.4em 0.8em;
		border: 1px solid var(--grey_light);
		border-radius: 0.3em;
		background: transparent;
		cursor: pointer;
		font-size: 0.85em;

		&:hover {
			border-color: var(--purple_bright);
			color: var(--purple_bright);
		}
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

	.check-btn {
		flex-shrink: 0;
		width: 1.6em;
		height: 1.6em;
		border: 2px solid var(--grey_light);
		border-radius: 0.3em;
		background: transparent;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.85em;
		color: var(--grey);
		transition: all 0.15s;

		&:hover:not(:disabled) {
			border-color: var(--purple_bright);
			color: var(--purple_bright);
		}

		&.is-checked {
			background: var(--green);
			border-color: var(--green);
			color: white;
		}

		&:disabled {
			opacity: 0.5;
			cursor: wait;
		}
	}

	.item-display {
		flex: 1;
	}
</style>
