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
	import CircularProgress from './CircularProgress.svelte';

	let { class: className = '' }: { class?: string } = $props();

	let selectedPreset = $state<FocusPresetId>(`classic`);
	let hours = $state(2);
	let permission = $state(notificationPermission());
	let setupOpen = $state(true);
	let compact = $state(false);

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

	let blocksToGo = $derived(
		$focusTimerState
			? $focusTimerState.phases.slice($focusTimerState.phaseIndex + 1).filter((phase) => phase.type === `work`).length
			: 0
	);

	let currentPhaseElapsedSeconds = $derived(
		currentPhase ? Math.max(0, Math.min(currentPhase.seconds, currentPhase.seconds - remainingMs / 1000)) : 0
	);
</script>

<div class="focus_timer {className}">
	{#if $focusTimerState && currentPhase}
		<div class="active" class:break={currentPhase.type === `break`} class:compact>
			<button class="compact_tog" onclick={() => (compact = !compact)}>{compact ? `Expand` : `Condense`}</button>
			<span class="phase">{currentPhase.label}</span>
			<span class="time">
				<CircularProgress
					progress={currentPhase.seconds > 0 ? currentPhaseElapsedSeconds / currentPhase.seconds : 0}
					size={28}
					strokeWidth={3}
					label="{currentPhase.label} progress"
				/>
				<div>{formatRemaining(remainingMs)}</div>
			</span>
			{#if blocksToGo > 0}
				<span class="description">{blocksToGo} block{blocksToGo === 1 ? `` : `s`} to go</span>
			{/if}
			<progress class="progress" value={currentPhaseElapsedSeconds} max={currentPhase.seconds}>
				{Math.round((currentPhaseElapsedSeconds / currentPhase.seconds) * 100)}%
			</progress>
			<div class="total_progress">
				{#each $focusTimerState.phases as phase, i (i)}
					<progress
						class="segment"
						class:break={phase.type === `break`}
						style="flex-grow: {phase.seconds}"
						value={i < $focusTimerState.phaseIndex
							? phase.seconds
							: i === $focusTimerState.phaseIndex
								? currentPhaseElapsedSeconds
								: 0}
						max={phase.seconds}
					></progress>
				{/each}
			</div>
				{#if $focusTimerState.paused}
					<button class="toggle" onclick={resumeFocusTimer}>Resume</button>
				{:else}
					<button class="toggle" onclick={pauseFocusTimer}>Pause</button>
				{/if}
				<button class="stop" onclick={stopFocusTimer}>Stop</button>
		</div>
	{:else}
	<button type="button" class="setup-toggle" aria-expanded={setupOpen} onclick={() => (setupOpen = !setupOpen)}>
				Focus timer
			</button>
			
			{#if setupOpen}
			{#if permission !== `granted` && permission !== `unsupported`}
						<button class="permission" onclick={enableNotifications}>Enable notifications</button>
					{/if}
				<div class="setup_content">
					
					<fieldset class="presets">
						<div>
							<legend>Preset</legend>
							{#each FOCUS_PRESETS as preset (preset.id)}
								<div class="selection">
									<input type="radio" id="focus-preset-{preset.id}" name="focus-preset" value={preset.id} bind:group={selectedPreset} />
									<label for="focus-preset-{preset.id}" aria-describedby="preset-{preset.id}-description">
										{preset.name}
									</label>
									<span id="preset-{preset.id}-description" class="preset_description">{preset.description}</span>
								</div>
							{/each}
						</div>
					</fieldset>
					{#if selectedPreset === `classic`}
						<div class="hours">
							<label for="focus-hours">Hours</label>
							<input type="number" id="focus-hours" min="0.5" max="12" step="0.5" bind:value={hours} />
						</div>
					{/if}
					
				</div>
				<button onclick={handleStart} class="start">Start</button>
			{/if}
	{/if}
</div>

<style>
	@import '@mixins';

	.focus_timer {
		position: fixed;
		right: max(20px, 5vw);
		top: 100px;
		z-index: 50;
		background: linear-gradient(rgb(255, 255, 255), color-mix(in oklch, rgb(247, 240, 235) 55%, rgb(255, 255, 255)));
		box-shadow: rgba(13, 13, 13, 0.04) 0px 1px 2px, rgba(95, 65, 50, 0.07) 0px 3px 10px;
		display: grid;
		grid-template-columns: auto 1fr auto;
		row-gap: 10px;
		max-width: 400px;

		&:has(.setup-toggle[aria-expanded=true]) {
			padding: 1em;
			top: calc(10vh - 1em);
			right: calc(max(20px, 5vw) - 1em);
			border: 1px solid color-mix(in oklch, rgb(247, 240, 235) 78%, rgb(13, 13, 13));
			border-radius: 1em;
		}

		&:has(.active) {
			border-radius: 1em;
		}
	}

	.setup-toggle {
		grid-column: 3;
	}

	.permission {
		order: -1;
	}

	.setup_content {
		grid-column: 1 / -1;
	}

	.presets {
		& > div {
			row-gap: 0;
		}

		& legend {
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

			&:has(input[type="radio"]:checked) {
				background: color-mix(in oklch, color-mix(in oklch, rgb(132, 57, 143) 91%, rgb(13, 13, 13)) 10%, transparent);
				border-color: color-mix(in oklch, rgb(132, 57, 143) 91%, rgb(13, 13, 13));
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

		& input[type="radio"] {
			&:focus {
				outline: none;
			}
		}

		.preset_description {
			font-size: 0.85em;
			color: color-mix(in oklch, rgb(96, 96, 96) 84%, rgb(13, 13, 13));
			font-weight: 400;
			grid-column: 2;
		}
	}

	.hours {
		display: flex;
		align-items: center;
		gap: 0.5em;
		background: color-mix(in oklch, rgb(255, 255, 255) 80%, rgb(247, 240, 235));
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

	.active {
		background: linear-gradient(155deg, color-mix(in oklch, rgb(132, 57, 143) 80%, rgb(245, 240, 240)) 0%, rgb(132, 57, 143) 55%, color-mix(in oklch, rgb(132, 57, 143) 80%, rgb(13, 13, 13)) 100%);
		padding: 1em;
		border-radius: 0.8em;
		display: grid;
		grid-template-columns: auto auto 1fr auto;
		align-items: center;
		grid-template-areas:
			'label timer desc desc'
			'prog prog prog prog'
			'total total total total'
			'toggle toggle toggle stop';
		column-gap: 20px;
		color: rgb(245, 240, 240);
		row-gap: 10px;

		&.break {
			background: linear-gradient(155deg, color-mix(in oklch, var(--green) 80%, rgb(245, 240, 240)) 0%, var(--green) 55%, color-mix(in oklch, var(--green) 80%, rgb(13, 13, 13)) 100%);;
			color: var(--green_text);
		}

		&.compact {
			grid-template-areas: 'timer desc' 'timer toggle';
			grid-template-columns: auto 1fr;

			.phase, .progress, .total_progress, .stop, .description {
				display: none;
			}

			.time {
				font-size: 0.8em;
			}
		}
	}

	.phase {
		grid-area: label;
		font-weight: 800;
		font-size: 0.8em;
		text-transform: uppercase;
		align-self: end;
	}

	.time {
		--circular_progress_size: 7ch;
		font-variant-numeric: tabular-nums;
		font-size: 1.2em;
		grid-area: timer;
		font-weight: 700;
		display: grid;
		align-items: center;
		align-content: center;
		position: relative;
		justify-content: center;


		& div {
			position: absolute;
			left: 1.2ch;
			text-align: center;
			width: 5ch;
		}
	}

	.description {
		font-size: 0.85em;
		font-weight: 700;
		grid-area: desc;
		text-align: right;
	}

	.progress {
		grid-area: prog;
		width: 100%;
		height: 0.5em;
		border-radius: 2em;
	}

	.total_progress {
		grid-area: total;
		display: flex;
		width: 100%;
		gap: 3px;
	}

	.segment {
		height: 1em;
		min-width: 4px;
		flex-shrink: 0;
		flex-basis: 0;
		border-radius: 3px;;

		&.break {
			opacity: 0.7;
		}
	}

	.progress, .segment {
		appearance: none;
		-webkit-appearance: none;
		border: none;
		overflow: hidden;
		color: inherit;

		&::-webkit-progress-bar {
			background: rgba(255, 255, 255, 0.25);
			border-radius: inherit;
		}

		&.break {
			&::-webkit-progress-bar {
				background: repeating-linear-gradient(45deg, rgba(245, 240, 240, 0.18) 0px, rgba(245, 240, 240, 0.18) 2px, transparent 2px, transparent 5px);
			}

			&::-webkit-progress-value {
				background: rgba(245, 240, 240, 0.55);
			}

			&::-moz-progress-bar {
				background: rgba(245, 240, 240, 0.55);
			}
		}

		&::-webkit-progress-value {
			background: currentColor;
			border-radius: inherit;
			transition: width 0.3s linear;
		}

		&::-moz-progress-bar {
			background: currentColor;
			border-radius: inherit;
		}
	}

	.toggle, .compact_tog {
		@include button_secondary;

		--button_text: var(--purple_bright_text);
		--button_border: var(--purple_bright_text);

		grid-area: toggle;

		&:hover {
			--button_background: var(--purple_bright_text);
			--button_text: var(--purple_bright);
		}
	}

	.toggle {
		grid-area: toggle;
	}

	.stop {
		@include button_text;

		--button_text: var(--purple_bright_text);

		grid-area: stop;

		&:hover {
			--button_text: var(--purple_bright_text);
		}
	}

	.compact_tog {
		grid-area: desc;
		align-self: start;
		justify-self: end;

	}

	@media(min-width: 50em) {
		.focus_timer {
			top: 50px;
		}
	}
</style>
