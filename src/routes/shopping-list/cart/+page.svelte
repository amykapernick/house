<script lang="ts">
	import { onMount } from 'svelte';
	import { isAuthenticated, getToken } from '$lib/auth';
	import fetchClientData, { setCache, getGraphqlUrl } from '$utils/fetchClientData';
	import { SHOPPING_LIST_QUERY } from '$lib/queries/shoppingList';
	import { resolve } from '$app/paths';
	import { SvelteSet } from 'svelte/reactivity';
	import Skeleton from '$parts/Skeleton/index.svelte';
	import EmptyState from '$parts/EmptyState/index.svelte';
	import CheckboxButton from '$parts/CheckboxButton/index.svelte';
	import { getPageTitle } from '$utils/pageTitle';
	import { formatCurrency } from '$utils/currency';
	import { getCartItems, addCartItem, removeCartItem, clearCartItems, type CartItem } from '$utils/shoppingCart';

	let items = $state<any[]>([]);
	let storeGroups = $state<any[]>([]);
	let freezerItems = $state<any[]>([]);
	let loading = $state(true);
	let checking = new SvelteSet<string>();

	let cartItems = $state<CartItem[]>([]);

	let name = $state('');
	let qty = $state(1);
	let price = $state<number | null>(null);
	let checkOffMatch = $state(true);

	onMount(() => {
		cartItems = getCartItems();
	});

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

	let uncheckedItems = $derived(items.filter((i) => !i.checked));

	// Auto-detect a matching (unchecked) shopping list item as the user types, so
	// they don't have to separately pick it from a list while standing in the aisle.
	let matchedItem = $derived(
		uncheckedItems.find((i) => i.display.trim().toLowerCase() === name.trim().toLowerCase())
	);

	let total = $derived(cartItems.reduce((sum, item) => sum + item.qty * item.price, 0));

	async function toggleItem(item: any, checked: boolean) {
		checking.add(item.id);

		const token = await getToken();
		const res = await fetch(getGraphqlUrl(), {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
			body: JSON.stringify({
				query: `mutation { checkShoppingItem(itemId: "${item.id}", source: "${item.source}", checked: ${checked}) { success } }`,
			}),
		}).then((r) => r.json());

		checking.delete(item.id);

		if (res?.errors || !res?.data?.checkShoppingItem?.success) return;

		items = items.map((i) => (i.id === item.id ? { ...i, checked } : i));
		storeGroups = storeGroups.map((store) => ({
			...store,
			items: store.items.map((i: any) => (i.id === item.id ? { ...i, checked } : i)),
			subGroups: store.subGroups.map((sub: any) => ({
				...sub,
				items: sub.items.map((i: any) => (i.id === item.id ? { ...i, checked } : i)),
			})),
		}));

		// Keep the shared cache in sync with /shopping-list, which reads the same key.
		setCache('shopping-list', { shoppingList: { items, storeGroups }, freezerItems });
	}

	async function addToCart() {
		const trimmed = name.trim();
		if (!trimmed || !price || price <= 0 || qty <= 0) return;

		const match = matchedItem;

		cartItems = addCartItem({
			name: trimmed,
			qty,
			price,
			...(match && checkOffMatch ? { matchedItemId: match.id } : {}),
		});

		if (match && checkOffMatch) {
			await toggleItem(match, true);
		}

		name = '';
		qty = 1;
		price = null;
	}

	function removeFromCart(id: string) {
		cartItems = removeCartItem(id);
	}

	function clearCart() {
		if (!confirm('Clear the whole cart?')) return;
		cartItems = clearCartItems();
	}
</script>

<svelte:head>
	<title>{getPageTitle(`Shopping Cart`)}</title>
</svelte:head>

<a
	href={resolve('/shopping-list')}
	class="back-link">← Shopping list</a
>

<h1>Shopping Cart</h1>

<form
	class="add-form"
	onsubmit={(e) => {
		e.preventDefault();
		addToCart();
	}}
>
	<input
		type="text"
		placeholder="Item name..."
		bind:value={name}
		list="shopping-list-items"
		aria-label="Item name"
	/>
	<datalist id="shopping-list-items">
		{#each uncheckedItems as item (item.id)}
			<option value={item.display}></option>
		{/each}
	</datalist>

	<input
		type="number"
		min="0.01"
		step="any"
		placeholder="Qty"
		value={qty}
		oninput={(e) => (qty = Number(e.currentTarget.value))}
		aria-label="Quantity"
	/>
	<input
		type="number"
		min="0.01"
		step="0.01"
		placeholder="Price ($)"
		value={price ?? ''}
		oninput={(e) => (price = e.currentTarget.value === '' ? null : Number(e.currentTarget.value))}
		aria-label="Price per item"
	/>

	{#if matchedItem}
		<span class="match-toggle">
			<input
				type="checkbox"
				id="check-off-match"
				bind:checked={checkOffMatch}
			/>
			<label for="check-off-match">Check off "{matchedItem.display}" on the list</label>
		</span>
	{/if}

	<button
		type="submit"
		disabled={!name.trim() || !price || price <= 0 || qty <= 0 || (matchedItem != null && checking.has(matchedItem.id))}>Add to cart</button
	>
</form>

{#if loading && cartItems.length === 0}
	<Skeleton rows={2} />
{:else if cartItems.length === 0}
	<EmptyState title="Cart is empty" message="Add items as you shop to keep a running total." />
{:else}
	<div class="controls">
		<p class="count">{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} · {formatCurrency(total)}</p>
		<button
			type="button"
			class="clear-btn"
			onclick={clearCart}>Clear cart</button
		>
	</div>

	<ul>
		{#each cartItems as item (item.id)}
			<li>
				<span class="item-row">
					<span class="item-name">{item.name}</span>
					<span class="item-detail">{item.qty} × {formatCurrency(item.price)}</span>
					{#if item.matchedItemId}
						<span class="matched-tag">✓ on list</span>
					{/if}
				</span>
				<span class="item-subtotal">{formatCurrency(item.qty * item.price)}</span>
				<button
					type="button"
					class="remove-btn"
					onclick={() => removeFromCart(item.id)}
					aria-label={`Remove ${item.name} from cart`}>×</button
				>
			</li>
		{/each}
	</ul>

	<p class="total">Total: {formatCurrency(total)}</p>
{/if}

{#if items.length}
	<details class="shopping-list-ref">
		<summary><h2>Shopping list ({uncheckedItems.length} to get)</h2></summary>
		<ul>
			{#each items as item (item.id)}
				<li class:checked={item.checked}>
					<CheckboxButton
						class="check-btn"
						variant="boxed"
						state={item.checked ? 'complete' : 'incomplete'}
						loading={checking.has(item.id)}
						onclick={() => toggleItem(item, !item.checked)}
						label={item.checked ? 'Uncheck item' : 'Check item'}
					/>
					<span class="item-name">{item.display}</span>
				</li>
			{/each}
		</ul>
	</details>
{/if}

<!-- TODO: migrate to CSS Modules (see #641) -->
<style>
	@import '@mixins';

	.back-link {
		display: inline-block;
		margin-bottom: 0.5em;
		color: var(--purple_bright);
		font-size: 0.9em;

		&:hover {
			text-decoration: underline;
		}
	}

	.add-form {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5em;
		margin-bottom: 1em;

		& input {
			padding: 0.5em 0.75em;
			border: 1px solid var(--grey_light);
			border-radius: 0.3em;
			font-size: 0.95em;

			&[type='text'] {
				flex: 1 1 12em;
			}

			&[type='number'] {
				width: 6em;
			}
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

	.match-toggle {
		display: flex;
		flex-basis: 100%;
		align-items: center;
		color: var(--grey);
		font-size: 0.85em;
		gap: 0.4em;

		& input,
		& label {
			cursor: pointer;
		}
	}

	.controls {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1em;
	}

	.count {
		margin: 0;
		color: var(--grey);
		font-size: 0.9em;
	}

	.clear-btn {

		@include button_text(red);
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
	}

	.item-row {
		display: flex;
		flex: 1;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.5em;
	}

	.item-name {
		font-weight: 500;
	}

	.item-detail {
		color: var(--grey);
		font-size: 0.85em;
	}

	.matched-tag {
		padding: 0.1em 0.5em;
		border: 1px solid currentColor;
		border-radius: 0.2em;
		color: var(--green);
		font-size: 0.75em;
	}

	.item-subtotal {
		flex-shrink: 0;
		font-size: 0.95em;
		font-variant-numeric: tabular-nums;
	}

	.remove-btn {
		display: flex;
		flex-shrink: 0;
		align-items: center;
		justify-content: center;
		width: 1.6em;
		height: 1.6em;
		border: 1px solid var(--grey_light);
		border-radius: 50%;
		background: none;
		color: var(--grey);
		font-size: 1em;
		line-height: 1;
		cursor: pointer;

		&:hover {
			border-color: var(--red);
			color: var(--red);
		}
	}

	.total {
		margin-top: 1em;
		font-size: 1.1em;
		font-weight: 600;
		text-align: right;
	}

	.shopping-list-ref {
		margin-top: 2em;

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

		& li.checked {
			opacity: 0.4;

			& .item-name {
				text-decoration: line-through;
			}
		}
	}

	:global(.check-btn) {
		flex-shrink: 0;
	}
</style>
