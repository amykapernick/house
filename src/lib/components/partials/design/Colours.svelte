<script lang="ts">
	import type { EditableColour } from '$types/colour';

	let {
		colours = $bindable([]),
		theme,
		editing = false,
		onChange,
	}: {
		colours: EditableColour[];
		theme: string;
		editing?: boolean;
		onChange?: () => void;
	} = $props();

	function updateField<K extends 'name' | 'neutral'>(id: string, field: K, value: EditableColour[K]) {
		colours = colours.map((c) => (c.id === id ? { ...c, [field]: value } : c));
		onChange?.();
	}

	function updateHex(id: string, hex: string) {
		colours = colours.map((c) => (c.id === id ? { ...c, hex: hex || null, link: hex ? null : c.link } : c));
		onChange?.();
	}

	function updateLink(id: string, link: string) {
		colours = colours.map((c) => (c.id === id ? { ...c, link: link || null, hex: link ? null : c.hex } : c));
		onChange?.();
	}

	function addColour() {
		colours = [...colours, { id: crypto.randomUUID(), name: ``, hex: `#000000`, link: null, theme, neutral: false, text: null }];
		onChange?.();
	}

	function removeColour(id: string) {
		colours = colours.filter((c) => c.id !== id);
		onChange?.();
	}
</script>

<table class="colours">
	<thead>
		<tr>
			<th>Name</th>
			<th>Value</th>
			<th>Neutral</th>
			{#if editing}<th class="actions"></th>{/if}
		</tr>
	</thead>
	<tbody>
		{#each colours as { id, name, hex, link, neutral } (id)}
			<tr>
				{#if editing}
					<td>
						<label for="name-{id}" class="sr-only">Name</label>
						<input id="name-{id}" type="text" value={name} oninput={(e) => updateField(id, `name`, e.currentTarget.value)} />
					</td>
					<td class="value-cell">
						<input type="color" aria-label="{name || `Colour`} hex value" value={hex ?? `#000000`} oninput={(e) => updateHex(id, e.currentTarget.value)} />
						<input type="text" aria-label="{name || `Colour`} hex code" placeholder="hex" value={hex ?? ``} oninput={(e) => updateHex(id, e.currentTarget.value)} />
						<span class="or">or link to</span>
						<select aria-label="{name || `Colour`} link" value={link ?? ``} onchange={(e) => updateLink(id, e.currentTarget.value)}>
							<option value="">No link</option>
							{#each colours.filter((c) => c.id !== id) as c (c.id)}<option value={c.name}>{c.name}</option>{/each}
						</select>
					</td>
					<td class="neutral-cell">
						<input type="checkbox" id="neutral-{id}" checked={neutral} onchange={(e) => updateField(id, `neutral`, e.currentTarget.checked)} />
						<label for="neutral-{id}">Neutral</label>
					</td>
					<td class="actions">
						<button type="button" onclick={() => removeColour(id)} aria-label="Remove {name || `colour`}">✕</button>
					</td>
				{:else}
					<td>
						<span class="swatch" style:background={hex ?? (link ? `var(--${link})` : `transparent`)}></span>
						{name}
					</td>
					<td>{hex ?? (link ? `links to ${link}` : ``)}</td>
					<td>{neutral ? `Yes` : ``}</td>
				{/if}
			</tr>
		{/each}
	</tbody>
</table>

{#if editing}
	<button type="button" class="add-item" onclick={addColour}>+ Add colour</button>
{/if}

<style>
	@import '@mixins';

	.colours {
		width: 100%;
		border-collapse: collapse;

		& th,
		& td {
			padding: 10px;
			border-bottom: 1px solid var(--grey_light);
			text-align: left;
		}

		& th {
			background: var(--navy);
			color: var(--navy_text);
		}
	}

	.swatch {
		display: inline-block;
		width: 0.9em;
		height: 0.9em;
		margin-right: 0.5em;
		border-radius: 50%;
	}

	.value-cell {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.4em;

		& input[type='text'] {
			width: 7em;
		}
	}

	.or {
		color: var(--grey);
		font-size: 0.85em;
	}

	.neutral-cell {
		display: flex;
		align-items: center;
		gap: 0.3em;
	}

	.actions {
		text-align: center;

		& button {
			padding: 0.2em 0.5em;
			border: none;
			background: none;
			color: var(--red);
			font-size: 1.1em;
			cursor: pointer;
		}
	}

	.add-item {
		margin-top: 0.75em;

		@include button_secondary;
	}
</style>
