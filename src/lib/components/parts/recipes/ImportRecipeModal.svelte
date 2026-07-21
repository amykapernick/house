<script lang="ts">
	import Modal from '$parts/Modal.svelte';
	import type { ModalAction } from '$parts/Modal.svelte';

	let {
		open = $bindable(false),
		url = $bindable(``),
		saving = false,
		error = ``,
		onImport,
	}: {
		open?: boolean;
		url?: string;
		saving?: boolean;
		error?: string;
		onImport: () => void;
	} = $props();

	let valid = $derived(url.trim().length > 0);

	let modalActions: ModalAction[] = $derived([
		{ label: `Cancel`, onclick: () => (open = false), style: `secondary`, variant: `danger`, disabled: saving },
		{ label: saving ? `Importing…` : `Import`, onclick: onImport, variant: `success`, disabled: !valid || saving },
	]);
</script>

<Modal bind:open title="Import recipe from URL" actions={modalActions}>
	<p class="hint">Paste a link to a recipe page and Mealie will scrape and import it.</p>

	<div class="field">
		<label for="import-recipe-url">Recipe URL</label>
		<input
			id="import-recipe-url"
			type="url"
			placeholder="https://example.com/some-recipe"
			bind:value={url}
			disabled={saving}
		/>
	</div>

	{#if error}<p class="error">{error}</p>{/if}
</Modal>

<style>
	@import '@mixins';

	.hint {
		margin: 0 0 1em;
		color: var(--grey);
		font-size: 0.9em;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.25em;
		margin-bottom: 1em;

		& input {
			padding: 0.5em;
			border: 1px solid var(--grey_light);
			border-radius: 0.3em;
			font-size: 1em;
		}
	}

	.error {
		color: var(--red);
	}
</style>
