<script lang="ts">
	import {
		FOCUS_PRESETS,
		focusTimerState,
		startFocusTimer,
		pauseFocusTimer,
		resumeFocusTimer,
		stopFocusTimer,
		notificationPermission,
		requestNotificationPermission,
		formatRemaining,
		type FocusPresetId,
	} from '$utils/focusTimer';

	let { class: className = '' }: { class?: string } = $props();

	let selectedPreset = $state<FocusPresetId>(`classic`);
	let hours = $state(2);
	let permission = $state(notificationPermission());

	async function enableNotifications() {
		permission = await requestNotificationPermission();
	}

	function handleStart() {
		startFocusTimer(selectedPreset, hours);
	}

	let currentPhase = $derived($focusTimerState?.phases[$focusTimerState.phaseIndex] ?? null);

	let remainingMs = $derived(
		$focusTimerState
			? $focusTimerState.paused
				? $focusTimerState.pausedRemainingMs
				: Math.max(0, $focusTimerState.phaseEndAt - Date.now())
			: 0
	);

	let blocksToGo = $derived($focusTimerState ? $focusTimerState.phases.length - $focusTimerState.phaseIndex - 1 : 0);
</script>

<div class="focus_timer {className}">
	{#if $focusTimerState && currentPhase}
		<div class="active" class:on_break={currentPhase.type === `break`}>
			<span class="phase_label">{currentPhase.label}</span>
			<span class="time">{formatRemaining(remainingMs)}</span>
			{#if blocksToGo > 0}
				<span class="progress">{blocksToGo} block{blocksToGo === 1 ? `` : `s`} to go</span>
			{/if}
			<div class="controls">
				{#if $focusTimerState.paused}
					<button onclick={resumeFocusTimer}>Resume</button>
				{:else}
					<button onclick={pauseFocusTimer}>Pause</button>
				{/if}
				<button class="stop" onclick={stopFocusTimer}>Stop</button>
			</div>
		</div>
	{:else}
		<details class="setup">
			<summary>Focus timer</summary>
			<div class="setup_content">
				{#if permission !== `granted` && permission !== `unsupported`}
					<button class="enable_notifications" onclick={enableNotifications}>Enable notifications</button>
				{/if}
				<fieldset class="presets">
					<legend>Preset</legend>
					{#each FOCUS_PRESETS as preset (preset.id)}
						<label>
							<input type="radio" name="focus-preset" value={preset.id} bind:group={selectedPreset} />
							<span class="preset_name">{preset.name}</span>
							<span class="preset_description">{preset.description}</span>
						</label>
					{/each}
				</fieldset>
				{#if selectedPreset === `classic`}
					<label class="hours_field">
						Hours
						<input type="number" min="0.5" max="12" step="0.5" bind:value={hours} />
					</label>
				{/if}
				<button onclick={handleStart}>Start</button>
			</div>
		</details>
	{/if}
</div>

<style>
	.focus_timer {
		margin-bottom: 1em;
	}

	summary {
		cursor: pointer;
		font-weight: 600;
	}

	.setup_content {
		display: flex;
		flex-direction: column;
		gap: 0.75em;
		margin-top: 0.5em;
		max-width: 24em;
	}

	.presets {
		border: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5em;

		legend {
			padding: 0;
			margin: 0 0 0.25em;
		}

		label {
			display: flex;
			flex-wrap: wrap;
			align-items: baseline;
			gap: 0 0.5em;
			font-weight: normal;
			color: inherit;
		}

		input {
			width: auto;
			margin: 0;
		}

		.preset_name {
			font-weight: 600;
		}

		.preset_description {
			flex-basis: 100%;
			font-size: 0.85em;
			color: var(--neutral);
		}
	}

	.hours_field {
		display: flex;
		align-items: center;
		gap: 0.5em;

		input {
			width: 5em;
			margin: 0;
		}
	}

	.active {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.75em;
		padding: 0.5em 1em;
		border-radius: 0.5em;
		background: var(--purple_bright);
		color: var(--purple_bright_text);

		&.on_break {
			background: var(--green);
			color: var(--green_text);
		}
	}

	.phase_label {
		font-weight: 600;
	}

	.time {
		font-variant-numeric: tabular-nums;
		font-size: 1.3em;
	}

	.progress {
		font-size: 0.85em;
	}

	.controls {
		display: flex;
		gap: 0.5em;
		margin-left: auto;
	}

	.stop {
		color: var(--red);
	}
</style>
