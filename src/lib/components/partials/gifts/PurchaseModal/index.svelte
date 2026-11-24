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
		status?: string;
		wishlistItemId?: string | null;
		wishlistClaimId?: string | null;
		ideaId?: string | null;
	};
</script>

<script lang="ts">
	import Modal from '$parts/Modal/index.svelte';
	import type { ModalAction } from '$parts/Modal/index.svelte';
	import Select from '$parts/Select/index.svelte';
	import { giftMutation, PURCHASE_STATUSES } from '$utils/gifts';
	import type { GiftPerson } from '$types/generated';
	import styles from './index.module.css';

	let {
		open = $bindable(false),
		draft,
		people,
		/** Claim this wishlist item for us first (so nobody else buys it), then log the details. */
		claimItemId = null,
		onSaved,
	}: {
		open?: boolean;
		draft: PurchaseDraft;
		people: GiftPerson[];
		claimItemId?: string | null;
		onSaved: (message?: string | null) => void;
	} = $props();

	let personId = $state(``);
	let title = $state(``);
	let url = $state(``);
	let notes = $state(``);
	let price = $state<string | number | null>(``);
	let occasionId = $state(``);
	let status = $state(`claimed`);
	let saving = $state(false);
	let error = $state(``);

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
		error = ``;
	});

	let isClaim = $derived(Boolean(claimItemId));
	let lockedToItem = $derived(isClaim || Boolean(draft.wishlistItemId));
	let personOptions = $derived(people.map((person) => ({ value: person.id, label: person.name })));
	// Each person's upcoming occasions come from the API; a purchase's year is its occasion's.
	let personOccasions = $derived(people.find((person) => person.id === personId)?.occasions ?? []);
	let occasionOptions = $derived([
		{ value: ``, label: `No occasion` },
		...personOccasions.map((occasion) => ({ value: occasion.id, label: occasion.name })),
	]);

	let valid = $derived(isClaim || (personId && title.trim().length > 0));

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
			title: title.trim(),
			url: url.trim() || null,
			notes: notes.trim() || null,
			price: parsedPrice,
			occasionId: occasionId || null,
			status,
			wishlistItemId: draft.wishlistItemId ?? null,
			wishlistClaimId: draft.wishlistClaimId ?? null,
			ideaId: draft.ideaId ?? null,
		};

		const result = isClaim
			? await giftMutation(`claimGiftWishlistItem`, `$itemId: ID!, $input: GiftPurchaseInput`, `itemId: $itemId, input: $input`, { itemId: claimItemId, input })
			: await giftMutation(`saveGiftPurchase`, `$id: ID, $input: GiftPurchaseInput!`, `id: $id, input: $input`, { id: draft.id ?? null, input });

		saving = false;

		if (!result.success) {
			error = result.message ?? `Couldn't save. Try again.`;
			return;
		}

		open = false;
		onSaved(result.message);
	}

	let actions: ModalAction[] = $derived([
		{ label: `Cancel`, onclick: () => (open = false), style: `secondary`, disabled: saving },
		{ label: saving ? `Saving…` : isClaim ? `Claim and save` : `Save`, onclick: save, variant: `success`, disabled: !valid || saving },
	]);
</script>

<Modal
	bind:open
	title={isClaim ? `Claim "${draft.title}"` : draft.id ? `Edit purchase` : `Log a purchase`}
	{actions}
>
	{#if isClaim}
		<p class={styles.hint}>This claims it on the family wishlist as you, so nobody else buys it. The details below stay between us.</p>
	{:else if draft.wishlistItemId}
		<p class={styles.hint}>Linked to their wishlist.</p>
	{/if}

	<div class={styles.fields}>
		{#if !lockedToItem}
			<Select
				id="purchase-person"
				label="For"
				bind:value={personId}
				options={personOptions}
			/>

			<label for="purchase-title">What</label>
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

	{#if error}<p
			class={styles.error}
			role="alert"
		>
			{error}
		</p>{/if}
</Modal>
