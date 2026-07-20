<script lang="ts">
	import type { EditableColour } from '$types/colour';

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

<ul class="colours">
	{#each colours as colour (colour.id)}
		<li style={`--colour_background: var(--${prefix}${colour.name}); --colour_background_text: var(--${prefix}${colour.name}_text);`}>
			{#if editing}
				<button type="button" class="swatch" onclick={() => onEdit?.(colour.id)}>
					<span class="name">{colour.name || `(unnamed)`}</span>
					{#if colour.hex}{colour.hex}{:else if colour.link}links to <code>{colour.link}</code>{/if}
				</button>
			{:else}
				<span class="name">{colour.name}</span>
				{#if colour.hex}{colour.hex}{:else if colour.link}links to <code>{colour.link}</code>{/if}
			{/if}
		</li>
	{/each}
	{#if editing}
		<li class="add-tile">
			<button type="button" onclick={() => onAdd?.()}>+ Add colour</button>
		</li>
	{/if}
</ul>

<style>
	.colours {
		display: grid;
		grid-template-columns: repeat(auto-fit, 120px);
		gap: 0.5em;
		padding: 0;
		list-style: none;

		& li {
			padding: 0.5em;
			background: var(--colour_background);
			color: var(--colour_background_text);
		}
	}

	.name {
		font-weight: 600;
	}

	.swatch {
		display: block;
		width: 100%;
		padding: 0;
		border: none;
		background: none;
		color: inherit;
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	.add-tile {
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px dashed var(--grey_light);
		background: none;

		& button {
			padding: 0;
			border: none;
			background: none;
			color: var(--grey);
			font: inherit;
			cursor: pointer;
		}
	}
</style>
