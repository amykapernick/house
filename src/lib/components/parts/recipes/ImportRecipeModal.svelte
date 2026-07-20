<script lang="ts">
	import Modal from '$parts/Modal.svelte';

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
</script>

<Modal bind:open title="Import recipe from URL">
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

	<div class="actions">
		<button onclick={onImport} disabled={!valid || saving}>
			{saving ? `Importing…` : `Import`}
		</button>
		<button onclick={() => (open = false)} disabled={saving}>Cancel</button>
	</div>
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

	.actions {
		display: flex;
		gap: 0.5em;
	}
</style>
