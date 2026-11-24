<script lang="ts">
	import Modal from '$parts/Modal/index.svelte';
	import type { ModalAction } from '$parts/Modal/index.svelte';
	import Select from '$parts/Select/index.svelte';
	import GiftTag from '$partials/gifts/GiftTag/index.svelte';
	import { giftMutation } from '$utils/gifts';
	import type { GiftPerson } from '$types/generated';
	import styles from './index.module.css';

	// Several ideas for one person at once, one per line - the same format as the family
	// wishlist's "Bulk add items". The API parses the lines (addGiftIdeas); the occasion and tag
	// picked here apply to all of them.
	let {
		open = $bindable(false),
		personId,
		people,
		onSaved,
	}: {
		open?: boolean;
		personId: string;
		people: GiftPerson[];
		onSaved: (message?: string | null) => void;
	} = $props();

	let text = $state(``);
	let occasionId = $state(``);
	let tag = $state(``);
	let saving = $state(false);
	let error = $state(``);

	$effect(() => {
		if (!open) return;
		text = ``;
		occasionId = ``;
		tag = ``;
		error = ``;
	});

	let personName = $derived(people.find((person) => person.id === personId)?.name ?? `them`);
	let occasionOptions = $derived([
		{ value: ``, label: `Any time` },
		...(people.find((person) => person.id === personId)?.occasions ?? []).map((occasion) => ({ value: occasion.id, label: occasion.name })),
	]);

	async function save() {
		saving = true;
		error = ``;
		const result = await giftMutation(`addGiftIdeas`, `$personId: ID!, $text: String!, $occasionId: ID, $tag: String`, `personId: $personId, text: $text, occasionId: $occasionId, tag: $tag`, {
			personId,
			text,
			occasionId: occasionId || null,
			tag: tag || null,
		});
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
		{ label: saving ? `Adding…` : `Add all`, onclick: save, variant: `success`, disabled: !text.trim() || saving },
	]);
</script>

<Modal
	bind:open
	title="Bulk add ideas for {personName}"
	{actions}
>
	<p class={styles.hint}>Ideas stay private to us unless you add them to their wishlist.</p>

	<div class={styles.fields}>
		<label for="bulk-ideas">Ideas, one per line <span class={styles.hint}>(up to 20)</span></label>
		<div
			id="bulk-ideas-hint"
			class={styles.example}
		>
			<p>For example:</p>
			<pre>{`Dinosaur puzzle - the 100 piece one
Rain jacket $45 - size 6, any colour
Paint set https://example.com/paints`}</pre>
		</div>
		<textarea
			id="bulk-ideas"
			rows="8"
			aria-describedby="bulk-ideas-hint"
			bind:value={text}
		></textarea>

		<Select
			id="bulk-ideas-occasion"
			label="For when"
			bind:value={occasionId}
			options={occasionOptions}
		/>

		<GiftTag
			id="bulk-ideas-tag"
			bind:tag
		/>
	</div>

	{#if error}<p
			class={styles.error}
			role="alert"
		>
			{error}
		</p>{/if}
</Modal>
