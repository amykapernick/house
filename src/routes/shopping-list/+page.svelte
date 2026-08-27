<script lang="ts">
	import { isAuthenticated, getToken } from '$lib/auth';
	import fetchClientData, { setCache, getGraphqlUrl } from '$utils/fetchClientData';
	import { SHOPPING_LIST_QUERY } from '$lib/queries/shoppingList';
	import { resolve } from '$app/paths';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import CheckboxButton from '$parts/CheckboxButton/index.svelte';
	import Skeleton from '$parts/Skeleton/index.svelte';
	import EmptyState from '$parts/EmptyState/index.svelte';
	import FreezerRecipesModal from '$partials/shoppingList/FreezerRecipesModal/index.svelte';
	import { getPageTitle } from '$utils/pageTitle';
	import Title from '$parts/Title/index.svelte';

	type SubGroup = { name: string; items: any[] };
	type StoreGroup = { name: string; items: any[]; subGroups: SubGroup[] };

	let items = $state<any[]>([]);
	let storeGroups = $state<StoreGroup[]>([]);
	let freezerItems = $state<any[]>([]);
	let loading = $state(true);
	let showChecked = $state(false);
	let checking = new SvelteSet<string>();
	let updatingServes = new SvelteSet<string>();
	let updatingUpcoming = new SvelteSet<string>();
	let newItemText = $state('');
	let adding = $state(false);
	let addingToFreezer = $state(false);
	let addError = $state('');

	let freezerModalOpen = $state(false);
	let editingFreezerItem = $state<any | null>(null);
	let freezerModalRecipes = $state<any[]>([]);
	let savingFreezerRecipes = $state(false);
	let freezerModalError = $state('');

	function fetchList(skipCache = false) {
		loading = true;
		function handleList(res: any) {
			items = res.shoppingList?.items ?? [];
			storeGroups = res.shoppingList?.storeGroups ?? [];
			freezerItems = res.freezerItems ?? [];
			loading = false;
		}
		fetchClientData({
			cacheKey: 'shopping-list',
			skipCache,
			onStale: handleList,
			gqlQuery: SHOPPING_LIST_QUERY,
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
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
			body: JSON.stringify({
				query: `mutation { createShoppingItem(note: ${JSON.stringify(note)}) { success } }`,
			}),
		}).then((r) => r.json());

		adding = false;

		if (res?.errors || !res?.data?.createShoppingItem?.success) {
			addError = 'Failed to add item.';
			return;
		}

		newItemText = '';
		fetchList(true);
	}

	async function addFreezerItem() {
		const name = newItemText.trim();
		if (!name) return;

		addingToFreezer = true;
		addError = '';

		const token = await getToken();
		const res = await fetch(getGraphqlUrl(), {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
			body: JSON.stringify({
				query: `mutation { createFreezerItem(name: ${JSON.stringify(name)}) { success item { id name serves type upcoming recipes { name slug } } } }`,
			}),
		}).then((r) => r.json());

		addingToFreezer = false;

		if (res?.errors || !res?.data?.createFreezerItem?.success) {
			addError = 'Failed to add freezer item.';
			return;
		}

		newItemText = '';
		freezerItems = [...freezerItems, res.data.createFreezerItem.item];
		setCache('shopping-list', { shoppingList: { items, storeGroups }, freezerItems });
	}

	async function adjustFreezerServes(item: any, delta: number) {
		const newServes = Math.max(0, (item.serves ?? 0) + delta);
		if (newServes === item.serves) return;

		updatingServes.add(item.id);

		const token = await getToken();
		const res = await fetch(getGraphqlUrl(), {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
			body: JSON.stringify({
				query: `mutation { updateFreezerItemServes(id: "${item.id}", serves: ${newServes}) { success } }`,
			}),
		}).then((r) => r.json());

		updatingServes.delete(item.id);

		if (res?.errors || !res?.data?.updateFreezerItemServes?.success) return;

		freezerItems = freezerItems.map((i) => (i.id === item.id ? { ...i, serves: newServes } : i));
		setCache('shopping-list', { shoppingList: { items, storeGroups }, freezerItems });
	}

	async function toggleFreezerUpcoming(item: any) {
		const newUpcoming = !item.upcoming;
		updatingUpcoming.add(item.id);

		const token = await getToken();
		const res = await fetch(getGraphqlUrl(), {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
			body: JSON.stringify({
				query: `mutation { updateFreezerItemUpcoming(id: "${item.id}", upcoming: ${newUpcoming}) { success } }`,
			}),
		}).then((r) => r.json());

		updatingUpcoming.delete(item.id);

		if (res?.errors || !res?.data?.updateFreezerItemUpcoming?.success) return;

		freezerItems = freezerItems.map((i) => (i.id === item.id ? { ...i, upcoming: newUpcoming } : i));
		setCache('shopping-list', { shoppingList: { items, storeGroups }, freezerItems });
	}

	function openFreezerRecipeEditor(item: any) {
		editingFreezerItem = item;
		freezerModalRecipes = [...(item.recipes ?? [])];
		freezerModalError = '';
		freezerModalOpen = true;
	}

	async function saveFreezerRecipes() {
		if (!editingFreezerItem) return;

		savingFreezerRecipes = true;
		freezerModalError = '';

		const recipeNames = freezerModalRecipes.map((r) => r.name);
		const token = await getToken();
		const res = await fetch(getGraphqlUrl(), {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
			body: JSON.stringify({
				query: `mutation { updateFreezerItemRecipes(id: "${editingFreezerItem.id}", recipeNames: ${JSON.stringify(recipeNames)}) { success } }`,
			}),
		}).then((r) => r.json());

		savingFreezerRecipes = false;

		if (res?.errors || !res?.data?.updateFreezerItemRecipes?.success) {
			freezerModalError = 'Failed to save recipes.';
			return;
		}

		const updatedRecipes = freezerModalRecipes;
		const itemId = editingFreezerItem.id;
		freezerItems = freezerItems.map((i) => (i.id === itemId ? { ...i, recipes: updatedRecipes } : i));
		setCache('shopping-list', { shoppingList: { items, storeGroups }, freezerItems });
		freezerModalOpen = false;
	}

	async function toggleItem(item: any) {
		const newChecked = !item.checked;
		checking.add(item.id);

		const token = await getToken();
		const res = await fetch(getGraphqlUrl(), {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
			body: JSON.stringify({
				query: `mutation { checkShoppingItem(itemId: "${item.id}", source: "${item.source}", checked: ${newChecked}) { success } }`,
			}),
		}).then((r) => r.json());

		checking.delete(item.id);

		if (res?.errors || !res?.data?.checkShoppingItem?.success) return;

		items = items.map((i) => (i.id === item.id ? { ...i, checked: newChecked } : i));
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
		setCache('shopping-list', { shoppingList: { items, storeGroups }, freezerItems });
	}

	// Items flagged as needing to be eaten soon float to the top.
	let sortedFreezerItems = $derived(
		[...freezerItems].sort((a, b) => Number(b.upcoming) - Number(a.upcoming))
	);

	const FREEZER_TYPE_ORDER = ['Meal', 'Component', 'Ingredient'];

	// Subsections by Type, mirroring the shopping list's store/sub-group grouping.
	let freezerGroups = $derived.by(() => {
		const groups = new SvelteMap<string, any[]>();
		for (const item of sortedFreezerItems) {
			const type = item.type ?? 'Uncategorised';
			if (!groups.has(type)) groups.set(type, []);
			groups.get(type)!.push(item);
		}
		return [...groups.entries()]
			.map(([name, groupItems]) => ({ name, items: groupItems }))
			.sort((a, b) => {
				const aIndex = FREEZER_TYPE_ORDER.indexOf(a.name);
				const bIndex = FREEZER_TYPE_ORDER.indexOf(b.name);
				if (aIndex === -1 && bIndex === -1) return a.name.localeCompare(b.name);
				if (aIndex === -1) return 1;
				if (bIndex === -1) return -1;
				return aIndex - bIndex;
			});
	});

	let uncheckedItems = $derived(items.filter((i) => !i.checked));
	let checkedItems = $derived(items.filter((i) => i.checked));

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
				subGroups: store.subGroups.map((sub) => ({ name: sub.name, items: filterItems(sub.items) })).filter((sub) => sub.items.length > 0),
			}))
			.filter((store) => store.items.length > 0 || store.subGroups.length > 0);
	});
</script>

<svelte:head>
	<title>{getPageTitle(`Shopping List`)}</title>
</svelte:head>

<Title>Shopping List</Title>

<a
	href={resolve('/shopping-list/cart')}
	class="cart-link">Shopping cart</a
>

<!-- TODO: Create a component for input + button/s using the autocomplete component as a basis -->
<!-- TODO: Allow adding freezer item with plain text "{ingredient} * {qty} #{type} @{recipe}" where type and recipe autocomplete the options when typing (type immediately after #, recipe after 3 characters) -->
<form
	class="quick-add"
	onsubmit={(e) => {
		e.preventDefault();
		addItem();
	}}
>
	<input
		type="text"
		placeholder="Add an item..."
		bind:value={newItemText}
		disabled={adding || addingToFreezer}
		aria-label="Add an item to the shopping list or freezer"
	/>
	<button
		type="submit"
		disabled={adding || addingToFreezer || !newItemText.trim()}>{adding ? 'Adding…' : 'Add to list'}</button
	>
	<button
		type="button"
		disabled={adding || addingToFreezer || !newItemText.trim()}
		onclick={addFreezerItem}>{addingToFreezer ? 'Adding…' : 'Add to freezer'}</button
	>
</form>
{#if addError}<p class="error">{addError}</p>{/if}

{#if loading}
	<Skeleton rows={3} />
{:else if items.length === 0}
	<EmptyState title="Shopping list is empty" />
{:else}
	<div class="controls">
		<p class="count">{uncheckedItems.length} items to get</p>
		<div class="toggle">
			<input
				type="checkbox"
				id="show-checked-items"
				bind:checked={showChecked}
			/>
			<label for="show-checked-items">Show checked items ({checkedItems.length})</label>
		</div>
	</div>

	{#each visibleStoreGroups as store (store.name)}
		<details
			class="store"
			open
		>
			<summary><h2>{sentenceCase(store.name)}</h2></summary>

			{#if store.items.length}
				<ul>
					{#each store.items as item (item.id)}
						{@render itemRow(item)}
					{/each}
				</ul>
			{/if}

			{#each store.subGroups as sub (sub.name)}
				<details
					class="sub-group"
					open
				>
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

{#if freezerItems.length}
	<details
		class="store"
		open
	>
		<summary><h2>Freezer</h2></summary>
		{#each freezerGroups as group (group.name)}
			<details
				class="sub-group"
				open
			>
				<summary><h3>{group.name}</h3></summary>
				<ul>
					{#each group.items as item (item.id)}
						{@render freezerRow(item)}
					{/each}
				</ul>
			</details>
		{/each}
	</details>
{/if}

<FreezerRecipesModal
	bind:open={freezerModalOpen}
	itemName={editingFreezerItem?.name ?? ''}
	bind:recipes={freezerModalRecipes}
	saving={savingFreezerRecipes}
	error={freezerModalError}
	onSave={saveFreezerRecipes}
/>

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
						<a
							href={resolve(`/recipes/[slug]`, { slug: recipe.slug })}
							class="recipe-tag">{recipe.name}</a
						>
					{/each}
				</span>
			{/if}
		</span>
	</li>
{/snippet}

{#snippet freezerRow(item: any)}
	<li class:upcoming={item.upcoming}>
		<span class="item-row">
			<span class="item-display">
				{item.name}
			</span>
			{#if item.recipes?.length}
				<span class="item-recipes">
					{#each item.recipes as recipe (recipe.name)}
						{#if recipe.slug}
							<a
								href={resolve(`/recipes/[slug]`, { slug: recipe.slug })}
								class="recipe-tag">{recipe.name}</a
							>
						{:else}
							<span class="recipe-tag recipe-tag-unlinked">{recipe.name}</span>
						{/if}
					{/each}
				</span>
			{/if}
			<button
				type="button"
				class="edit-recipes"
				onclick={() => openFreezerRecipeEditor(item)}>{item.recipes?.length ? 'Edit recipes' : 'Link recipe'}</button
			>
			<span class="upcoming-toggle">
				<input
					type="checkbox"
					id={`freezer-upcoming-${item.id}`}
					checked={item.upcoming}
					disabled={updatingUpcoming.has(item.id)}
					onchange={() => toggleFreezerUpcoming(item)}
				/>
				<label for={`freezer-upcoming-${item.id}`}>Eat soon</label>
			</span>
		</span>
		<span class="serves-control">
			<button
				type="button"
				class="serves-btn"
				disabled={updatingServes.has(item.id) || !item.serves}
				onclick={() => adjustFreezerServes(item, -1)}
				aria-label={`Decrease serves of ${item.name}`}>−</button
			>
			<span class="serves-value">{item.serves ?? 0}</span>
			<button
				type="button"
				class="serves-btn"
				disabled={updatingServes.has(item.id)}
				onclick={() => adjustFreezerServes(item, 1)}
				aria-label={`Increase serves of ${item.name}`}>+</button
			>
		</span>
	</li>
{/snippet}

<!-- TODO: migrate to CSS Modules (see #641) -->
<style>
	@import '@mixins';

	.cart-link {
		display: inline-block;
		margin-bottom: 1em;
		color: var(--purple_bright);
		font-size: 0.9em;

		&:hover {
			text-decoration: underline;
		}
	}

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
			font-size: 0.95em;
			cursor: pointer;

			&:disabled {
				opacity: 0.5;
				cursor: wait;
			}
		}
	}

	.error {
		margin: 0 0 1em;
		color: var(--red);
	}

	.controls {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1.5em;
	}

	.count {
		margin: 0;
		color: var(--grey);
		font-size: 0.9em;
	}

	.toggle {
		display: flex;
		align-items: center;
		color: var(--grey);
		font-size: 0.85em;
		cursor: pointer;
		gap: 0.4em;

		& input {
			cursor: pointer;
		}
	}

	.store {
		margin-bottom: 1.5em;

		& > summary {
			list-style: none;
			cursor: pointer;

			&::marker,
			&::-webkit-details-marker {
				display: none;
			}

			& h2 {
				display: flex;
				align-items: center;
				margin: 0;
				padding-bottom: 0.3em;
				border-bottom: 2px solid var(--navy);
				font-size: 1.1em;
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
			list-style: none;
			cursor: pointer;

			&::marker,
			&::-webkit-details-marker {
				display: none;
			}

			& h3 {
				display: flex;
				align-items: center;
				margin: 0;
				padding-bottom: 0.2em;
				border-bottom: 1px solid var(--grey_light);
				color: var(--navy);
				font-size: 0.95em;
				text-transform: capitalize;
				gap: 0.5em;

				&::before {
					content: '▸';
					transition: transform 0.15s;
					font-size: 0.8em;
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
		border-bottom: 1px solid color-mix(in oklch, var(--grey_light) 50%, var(--transparent));

		&.checked {
			opacity: 0.4;

			& .item-display {
				text-decoration: line-through;
			}
		}

		&.upcoming {
			border-left: 3px solid var(--warning);
			background: var(--warning_bg);
		}
	}

	:global(.check-btn) {
		flex-shrink: 0;
	}

	.item-row {
		display: flex;
		flex: 1;
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
		color: var(--purple_bright);
		font-size: 0.75em;
		text-decoration: none;

		&:hover {
			text-decoration: underline;
		}
	}

	.recipe-tag-unlinked {
		color: var(--grey);
		cursor: default;
	}

	.edit-recipes {

		@include button_text;
	}

	.upcoming-toggle {
		display: flex;
		align-items: center;
		color: var(--grey);
		font-size: 0.75em;
		gap: 0.3em;

		& input {
			cursor: pointer;
		}

		& label {
			cursor: pointer;
		}
	}

	.serves-control {
		display: flex;
		flex-shrink: 0;
		align-items: center;
		gap: 0.4em;
	}

	.serves-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.6em;
		height: 1.6em;
		border: 1px solid var(--grey_light);
		border-radius: 50%;
		background: none;
		color: var(--navy);
		font-size: 0.9em;
		line-height: 1;
		cursor: pointer;

		&:disabled {
			opacity: 0.4;
			cursor: default;
		}

		&:not(:disabled):hover {
			border-color: var(--purple_bright);
			color: var(--purple_bright);
		}
	}

	.serves-value {
		min-width: 1.2em;
		color: var(--grey);
		font-size: 0.85em;
		text-align: center;
	}
</style>
