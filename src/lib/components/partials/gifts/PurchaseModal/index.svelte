<script
	module
	lang="ts"
>
	export type PurchaseDraft = {
		id?: string | null;
		personId: string;
		title: string;
		url?: string | null;
		notes?: string | null;
		price?: number | null;
		occasionId?: string | null;
		/** Shown as an option when the occasion isn't one of the person's upcoming ones (a past one). */
		occasionName?: string | null;
		status?: string;
		wishlistItemId?: string | null;
		wishlistClaimId?: string | null;
		ideaId?: string | null;
		tag?: string | null;
	};
</script>

<script lang="ts">
	import Modal from '$parts/Modal/index.svelte';
	import type { ModalAction } from '$parts/Modal/index.svelte';
	import Select from '$parts/Select/index.svelte';
	import PillRadio from '$parts/PillRadio/index.svelte';
	import GiftTag from '$partials/gifts/GiftTag/index.svelte';
	import { fetchGiftPerson, giftMutation, PURCHASE_STATUSES } from '$utils/gifts';
	import type { GiftPerson, GiftWishlistItem } from '$types/generated';
	import styles from './index.module.css';

	let {
		open = $bindable(false),
		draft,
		people,
		/** Claim this wishlist item for us first (so nobody else buys it), then log the details. */
		claimItemId = null,
		/**
		 * Offer their wishlist: pick an item on it (claims it) or add something new (saved here
		 * only; it goes on their wishlist once the occasion is past). Needs the wishlist.
		 */
		fromWishlist = false,
		onSaved,
	}: {
		open?: boolean;
		draft: PurchaseDraft;
		people: GiftPerson[];
		claimItemId?: string | null;
		fromWishlist?: boolean;
		onSaved: (message?: string | null) => void;
	} = $props();

	let personId = $state(``);
	let title = $state(``);
	let url = $state(``);
	let notes = $state(``);
	let price = $state<string | number | null>(``);
	let occasionId = $state(``);
	let status = $state(`claimed`);
	let tag = $state(``);
	let saving = $state(false);
	let deleting = $state(false);
	let error = $state(``);
	// fromWishlist: the wishlist item picked, NEW for something new, or `` before choosing.
	const NEW = `new`;
	let choice = $state(``);
	let wishlist = $state<GiftWishlistItem[]>([]);
	let wishlistLoading = $state(false);

	// Reset the form from the draft each time the modal opens.
	$effect(() => {
		if (!open) return;
		personId = draft.personId ?? ``;
		title = draft.title ?? ``;
		url = draft.url ?? ``;
		notes = draft.notes ?? ``;
		price = draft.price != null ? String(draft.price) : ``;
		occasionId = draft.occasionId ?? ``;
		status = draft.status ?? `claimed`;
		tag = draft.tag ?? ``;
		error = ``;
		choice = ``;
		wishlist = [];
	});

	// Their wishlist, for the "What" dropdown (cached, so usually instant).
	$effect(() => {
		if (!open || !fromWishlist || !personId) return;
		const id = personId;
		wishlistLoading = true;
		const handle = (data: GiftPerson | null) => {
			if (personId !== id) return;
			wishlist = (data?.wishlist ?? []).filter((item) => item.canClaim);
			wishlistLoading = false;
		};
		fetchGiftPerson(id, { onStale: handle }).then(handle);
	});

	let pickedItem = $derived(wishlist.find((item) => item.id === choice) ?? null);
	let personName = $derived(people.find((person) => person.id === personId)?.name ?? `them`);

	let claimId = $derived(claimItemId ?? pickedItem?.id ?? null);
	let isClaim = $derived(Boolean(claimId));
	let isNew = $derived(fromWishlist && choice === NEW);
	let lockedToItem = $derived(isClaim || Boolean(draft.wishlistItemId));
	// Picking from their wishlist shows nothing else until "Something new" is chosen.
	let showFields = $derived(!fromWishlist || isNew);
	let personOptions = $derived(people.map((person) => ({ value: person.id, label: person.name })));
	// Each person's upcoming occasions come from the API; a purchase's year is its occasion's.
	let personOccasions = $derived(people.find((person) => person.id === personId)?.occasions ?? []);
	let occasionOptions = $derived([
		{ value: ``, label: `No occasion` },
		...personOccasions.map((occasion) => ({ value: occasion.id, label: occasion.name })),
		// A past occasion isn't in their upcoming list, but it's still the one this is for.
		...(draft.occasionId && !personOccasions.some((occasion) => occasion.id === draft.occasionId)
			? [{ value: draft.occasionId, label: draft.occasionName ?? `Past occasion` }]
			: []),
	]);

	let occasionLabel = $derived(occasionOptions.find((option) => option.value === occasionId && option.value)?.label ?? null);

	let valid = $derived(isClaim || (Boolean(personId) && title.trim().length > 0 && (!fromWishlist || isNew)));

	async function save() {
		saving = true;
		error = ``;

		// A number input binds a number (or null when empty), not a string.
		const parsedPrice = String(price ?? ``).trim() ? Number(price) : null;
		if (parsedPrice != null && (!Number.isFinite(parsedPrice) || parsedPrice < 0)) {
			error = `Price needs to be a number`;
			saving = false;
			return;
		}

		const input = {
			personId,
			// A picked wishlist item keeps its own title and link, whatever was typed before picking it.
			title: pickedItem ? pickedItem.title : title.trim(),
			url: pickedItem ? pickedItem.url ?? null : url.trim() || null,
			notes: notes.trim() || null,
			price: parsedPrice,
			occasionId: occasionId || null,
			status,
			wishlistItemId: draft.wishlistItemId ?? null,
			wishlistClaimId: draft.wishlistClaimId ?? null,
			ideaId: draft.ideaId ?? null,
			tag: tag || null,
		};

		const result = isClaim
			? await giftMutation(`claimGiftWishlistItem`, `$itemId: ID!, $input: GiftPurchaseInput`, `itemId: $itemId, input: $input`, { itemId: claimId, input })
			: await giftMutation(`saveGiftPurchase`, `$id: ID, $input: GiftPurchaseInput!`, `id: $id, input: $input`, { id: draft.id ?? null, input });

		saving = false;

		if (!result.success) {
			error = result.message ?? `Couldn't save. Try again.`;
			return;
		}

		open = false;
		onSaved(result.message);
	}

	async function remove() {
		if (!draft.id || !confirm(`Delete "${draft.title}"? Anything claimed on the family wishlist stays claimed.`)) return;
		deleting = true;
		const result = await giftMutation(`deleteGiftPurchase`, `$id: ID!`, `id: $id`, { id: draft.id });
		deleting = false;

		if (!result.success) {
			error = result.message ?? `Couldn't delete. Try again.`;
			return;
		}

		open = false;
		onSaved();
	}

	let actions: ModalAction[] = $derived([
		...(draft.id ? [{ label: deleting ? `Deleting…` : `Delete`, onclick: remove, variant: `danger` as const, style: `secondary` as const, disabled: saving || deleting }] : []),
		{ label: `Cancel`, onclick: () => (open = false), style: `secondary`, disabled: saving || deleting },
		{ label: saving ? `Saving…` : isClaim ? `Claim and save` : `Save`, onclick: save, variant: `success`, disabled: !valid || saving || deleting },
	]);
</script>

<Modal
	bind:open
	class={fromWishlist ? styles.sized : ``}
	title={fromWishlist ? `Add a gift for ${personName}` : isClaim ? `Claim "${draft.title}"` : draft.id ? `Edit purchase` : `Log a purchase`}
	{actions}
>
	{#if fromWishlist}
		{#if isNew}
			<button
				type="button"
				class={styles.back}
				onclick={() => (choice = ``)}>Choose from their wishlist instead</button
			>
		{:else}
			<fieldset class={styles.gifts}>
				<legend>What from {personName}'s wishlist?</legend>
				{#if wishlistLoading && !wishlist.length}
					<p class={styles.hint}>Loading their wishlist…</p>
				{:else if !wishlist.length}
					<p class={styles.hint}>Nothing on their wishlist left to claim.</p>
				{/if}
				<div class={styles.pills}>
					{#each wishlist as item (item.id)}
						<PillRadio
							id="purchase-what-{item.id}"
							name="purchase-what"
							label={item.evergreen ? `${item.title} (always wanted)` : item.title}
							value={item.id}
							bind:group={choice}
						/>
					{/each}
					<PillRadio
						id="purchase-what-new"
						name="purchase-what"
						label="Something else"
						value={NEW}
						bind:group={choice}
					/>
				</div>
			</fieldset>
		{/if}
	{/if}

	{#if isNew}
		<p class={styles.hint}>
			This stays between us for now. {#if occasionLabel}After {occasionLabel}{:else}Once its occasion is over{/if}, it goes on {personName}'s family wishlist as a gift from you.
		</p>
	{:else if isClaim}
		<p class={styles.hint}>This claims it on the family wishlist as you, so nobody else buys it. The details below stay between us.</p>
	{:else if draft.wishlistItemId}
		<p class={styles.hint}>Linked to their wishlist.</p>
	{/if}

	{#if showFields || isClaim}
		<GiftTag
			id="purchase-tag"
			bind:tag
		/>
	{/if}

	{#if showFields}
		<div class={styles.fields}>
			{#if !lockedToItem}
				{#if !fromWishlist}
					<Select
						id="purchase-person"
						label="For"
						bind:value={personId}
						options={personOptions}
					/>
				{/if}

				<label for="purchase-title">{fromWishlist ? `Gift` : `What`}</label>
				<input
					id="purchase-title"
					type="text"
					bind:value={title}
					required
				/>
			{/if}

			<Select
				id="purchase-occasion"
				label="Occasion"
				bind:value={occasionId}
				options={occasionOptions}
			/>

			<label for="purchase-price">Price ($)</label>
			<input
				id="purchase-price"
				type="number"
				inputmode="decimal"
				min="0"
				step="0.01"
				bind:value={price}
			/>

			{#if !lockedToItem}
				<label for="purchase-url">Link</label>
				<input
					id="purchase-url"
					type="url"
					bind:value={url}
				/>
			{/if}

			<Select
				id="purchase-status"
				label="Status"
				bind:value={status}
				options={[...PURCHASE_STATUSES]}
			/>

			<label for="purchase-notes">Notes</label>
			<textarea
				id="purchase-notes"
				rows="2"
				bind:value={notes}
			></textarea>
		</div>
	{/if}

	{#if error}<p
			class={styles.error}
			role="alert"
		>
			{error}
		</p>{/if}
</Modal>
