<script lang="ts">
	import type { Snippet } from 'svelte';
	import { FOCUS_PRESETS, startFocusTimer, type FocusPresetId } from '$utils/focusTimer';

	let { children }: { children?: Snippet } = $props();

	let selectedPreset = $state<FocusPresetId>(`classic`);
	let hours = $state(2);
	let setupOpen = $state(true);

	let needsHours = $derived(FOCUS_PRESETS.find((preset) => preset.id === selectedPreset)?.needsHours ?? false);

	function handleStart() {
		startFocusTimer(selectedPreset, hours);
	}
</script>

{#if setupOpen}
	<div class="setup_content">
		<span class="permission">{@render children?.()}</span>
		<fieldset class="presets">
			<div>
				<legend>Preset</legend>
				{#each FOCUS_PRESETS as preset (preset.id)}
					<div class="selection">
						<input
							type="radio"
							id="focus-preset-{preset.id}"
							name="focus-preset"
							value={preset.id}
							bind:group={selectedPreset}
						/>
						<label
							for="focus-preset-{preset.id}"
							aria-describedby="preset-{preset.id}-description"
						>
							{preset.name}
						</label>
						<span
							id="preset-{preset.id}-description"
							class="preset_description">{preset.description}</span
						>
					</div>
				{/each}
			</div>
		</fieldset>
		{#if needsHours}
			<div class="hours">
				<label for="focus-hours">Hours</label>
				<input
					type="number"
					id="focus-hours"
					min="1"
					max="4"
					step="0.25"
					bind:value={hours}
				/>
			</div>
		{/if}
	</div>
	<button
		onclick={handleStart}
		class="start">Start</button
	>
{/if}

<style>
	.permission {
		position: absolute;
		right: 1em;
		top: 1em;
	}

	.setup_content {
		grid-column: 1 / -1;
	}

	.presets {
		& > div {
			row-gap: 0;
		}

		& legend {
			margin-top: 0.5em;
			margin-bottom: 10px;
		}

		.selection {
			display: grid;
			grid-template-columns: subgrid;
			grid-template-rows: subgrid;
			grid-column: 1 / -1;
			grid-row-end: span 2;
			border: 1.5px solid var(--transparent);
			padding: 1em;
			border-radius: 0.8em;
			position: relative;

			&:has(input[type='radio']:checked) {
				background: color-mix(in oklch, color-mix(in oklch, var(--light_purple_bright) 91%, var(--black)) 10%, var(--transparent));
				border-color: var(--purple_solid_flat);
			}

			&:focus-within {
				outline: 2px dotted var(--green);
			}
		}

		& label {
			font-size: 1.1em;
			font-weight: 600;
			cursor: pointer;

			&::before {
				content: '';
				position: absolute;
				inset: 0;
			}
		}

		& input[type='radio'] {
			&:focus {
				outline: none;
			}
		}

		.preset_description {
			font-size: 0.85em;
			color: var(--text_secondary);
			font-weight: 400;
			grid-column: 2;
		}
	}

	.hours {
		display: flex;
		align-items: center;
		gap: 0.5em;
		background: color-mix(in oklch, var(--white_true) 80%, var(--background));
		display: grid;
		grid-template-columns: 1fr auto;
		padding: 0.5em;
		border-radius: 0.5em;

		input {
			width: 5em;
			margin: 0;
		}
	}

	.start {
		margin-top: 20px;
		font-size: 1.2em;
		grid-column: 1 / -1;
	}
</style>
