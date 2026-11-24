<script
	module
	lang="ts"
>
	export type IdeaDraft = {
		id?: string | null;
		personId: string;
		title?: string;
		url?: string | null;
		notes?: string | null;
		price?: number | null;
		occasionId?: string | null;
		status?: string;
	};
</script>

<script lang="ts">
	import Modal from '$parts/Modal/index.svelte';
	import type { ModalAction } from '$parts/Modal/index.svelte';
	import Select from '$parts/Select/index.svelte';
	import { giftMutation } from '$utils/gifts';
	import type { GiftPerson } from '$types/generated';
	import styles from './index.module.css';

	let {
		open = $bindable(false),
		draft,
		people,
		onSaved,
	}: {
		open?: boolean;
		draft: IdeaDraft;
		people: GiftPerson[];
		onSaved: () => void;
	} = $props();

	let personId = $state(``);
	let title = $state(``);
	let url = $state(``);
	let notes = $state(``);
	let price = $state<string | number | null>(``);
	let occasionId = $state(``);
	let saving = $state(false);
	let error = $state(``);

	$effect(() => {
		if (!open) return;
		personId = draft.personId ?? ``;
		title = draft.title ?? ``;
		url = draft.url ?? ``;
		notes = draft.notes ?? ``;
		price = draft.price != null ? String(draft.price) : ``;
		occasionId = draft.occasionId ?? ``;
		error = ``;
	});

	let personOptions = $derived(people.map((person) => ({ value: person.id, label: person.name })));
	let occasionOptions = $derived([
		{ value: ``, label: `Any time` },
		...(people.find((person) => person.id === personId)?.occasions ?? []).map((occasion) => ({ value: occasion.id, label: occasion.name })),
	]);

	let valid = $derived(Boolean(personId) && title.trim().length > 0);

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

		const result = await giftMutation(`saveGiftIdea`, `$id: ID, $input: GiftIdeaInput!`, `id: $id, input: $input`, {
			id: draft.id ?? null,
			input: {
				personId,
				title: title.trim(),
				url: url.trim() || null,
				notes: notes.trim() || null,
				price: parsedPrice,
				occasionId: occasionId || null,
				status: draft.status ?? `open`,
			},
		});

		saving = false;

		if (!result.success) {
			error = result.message ?? `Couldn't save. Try again.`;
			return;
		}

		open = false;
		onSaved();
	}

	let actions: ModalAction[] = $derived([
		{ label: `Cancel`, onclick: () => (open = false), style: `secondary`, disabled: saving },
		{ label: saving ? `Saving…` : `Save`, onclick: save, variant: `success`, disabled: !valid || saving },
	]);
</script>

<Modal
	bind:open
	title={draft.id ? `Edit idea` : `Add an idea`}
	{actions}
>
	<p class={styles.hint}>Ideas stay private to us unless you add them to their wishlist.</p>

	<div class={styles.fields}>
		<Select
			id="idea-person"
			label="For"
			bind:value={personId}
			options={personOptions}
		/>

		<label for="idea-title">Idea</label>
		<input
			id="idea-title"
			type="text"
			bind:value={title}
			required
		/>

		<Select
			id="idea-occasion"
			label="For when"
			bind:value={occasionId}
			options={occasionOptions}
		/>

		<label for="idea-price">Rough price ($)</label>
		<input
			id="idea-price"
			type="number"
			inputmode="decimal"
			min="0"
			step="0.01"
			bind:value={price}
		/>

		<label for="idea-url">Link</label>
		<input
			id="idea-url"
			type="url"
			bind:value={url}
		/>

		<label for="idea-notes">Notes</label>
		<textarea
			id="idea-notes"
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
