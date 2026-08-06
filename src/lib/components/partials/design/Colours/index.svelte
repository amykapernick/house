<script lang="ts">
	import type { EditableColour } from '$types/colour';
	import styles from './index.module.css';

	let {
		colours,
		theme,
		editing = false,
		onEdit,
		onAdd,
	}: {
		colours: EditableColour[];
		theme: string;
		editing?: boolean;
		onEdit?: (id: string) => void;
		onAdd?: () => void;
	} = $props();

	// Matches the `light_`/`dark_` constant naming buildColoursCss emits, so a
	// swatch's background/text reads from the exact custom properties the live
	// preview (and the real generated stylesheet) declare for this theme.
	const prefix = $derived(theme === `Light` ? `light_` : theme === `Dark` ? `dark_` : ``);
</script>

<ul class={styles.colours}>
	{#each colours as colour (colour.id)}
		<li style={`--colour_background: var(--${prefix}${colour.name}); --colour_background_text: var(--${prefix}${colour.name}_text);`}>
			{#if editing}
				<button type="button" class={styles.swatch} onclick={() => onEdit?.(colour.id)}>
					<span class={styles.name}>{colour.name || `(unnamed)`}</span>
					{#if colour.hex}{colour.hex}{:else if colour.link}links to <code>{colour.link}</code>{/if}
				</button>
			{:else}
				<span class={styles.name}>{colour.name}</span>
				{#if colour.hex}{colour.hex}{:else if colour.link}links to <code>{colour.link}</code>{/if}
			{/if}
		</li>
	{/each}
	{#if editing}
		<li class={styles['add-tile']}>
			<button type="button" onclick={() => onAdd?.()}>+ Add colour</button>
		</li>
	{/if}
</ul>
