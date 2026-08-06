<script lang="ts">
	import Modal from '$parts/Modal/index.svelte';
	import type { ModalAction } from '$parts/Modal/index.svelte';
	import styles from './index.module.css';

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
	<p class={styles.hint}>Paste a link to a recipe page and Mealie will scrape and import it.</p>

	<div class={styles.field}>
		<label for="import-recipe-url">Recipe URL</label>
		<input
			id="import-recipe-url"
			type="url"
			placeholder="https://example.com/some-recipe"
			bind:value={url}
			disabled={saving}
		/>
	</div>

	{#if error}<p class={styles.error}>{error}</p>{/if}
</Modal>
