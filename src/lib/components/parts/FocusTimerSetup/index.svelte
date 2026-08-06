<script lang="ts">
	import type { Snippet } from 'svelte';
	import { FOCUS_PRESETS, startFocusTimer, type FocusPresetId } from '$utils/focusTimer';
	import styles from './index.module.css';

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
	<div class={styles.setup_content}>
		<span class={styles.permission}>{@render children?.()}</span>
		<fieldset class={styles.presets}>
			<div>
				<legend>Preset</legend>
				{#each FOCUS_PRESETS as preset (preset.id)}
					<div class={styles.selection}>
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
							class={styles.preset_description}>{preset.description}</span
						>
					</div>
				{/each}
			</div>
		</fieldset>
		{#if needsHours}
			<div class={styles.hours}>
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
		class={styles.start}>Start</button
	>
{/if}
