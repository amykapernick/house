<script lang="ts">
	import { focusTimerState, pauseFocusTimer, resumeFocusTimer, stopFocusTimer, formatRemaining } from '$utils/focusTimer';
	import CircularProgress from './CircularProgress.svelte';
	import type { Snippet } from 'svelte';

	let { open = $bindable(false), children }: { open?: boolean; children?: Snippet } = $props();

	let currentPhase = $derived($focusTimerState?.phases[$focusTimerState.phaseIndex] ?? null);

	let remainingMs = $derived($focusTimerState ? ($focusTimerState.paused ? $focusTimerState.pausedRemainingMs : Math.max(0, $focusTimerState.phaseEndAt - Date.now())) : 0);

	let blocksToGo = $derived($focusTimerState ? $focusTimerState.phases.slice($focusTimerState.phaseIndex + 1).filter((phase) => phase.type === `work`).length : 0);

	let currentPhaseElapsedSeconds = $derived(currentPhase ? Math.max(0, Math.min(currentPhase.seconds, currentPhase.seconds - remainingMs / 1000)) : 0);
</script>

{#if $focusTimerState && currentPhase}
	<div
		class="active"
		class:break={currentPhase.type === `break`}
		class:compact={!open}
	>
		<span class="permission">{@render children?.()}</span>
		<button
			class="compact_tog"
			onclick={() => (open = !open)}>{open ? `Condense` : `Expand`}</button
		>
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
		<progress
			class="progress"
			value={currentPhaseElapsedSeconds}
			max={currentPhase.seconds}
		>
			{Math.round((currentPhaseElapsedSeconds / currentPhase.seconds) * 100)}%
		</progress>
		<div class="total_progress">
			{#each $focusTimerState.phases as phase, i (i)}
				<progress
					class="segment"
					class:break={phase.type === `break`}
					style="flex-grow: {phase.seconds}"
					value={i < $focusTimerState.phaseIndex ? phase.seconds : i === $focusTimerState.phaseIndex ? currentPhaseElapsedSeconds : 0}
					max={phase.seconds}
				></progress>
			{/each}
		</div>
		{#if $focusTimerState.paused}
			<button
				class="toggle"
				onclick={resumeFocusTimer}>Resume</button
			>
		{:else}
			<button
				class="toggle"
				onclick={pauseFocusTimer}>Pause</button
			>
		{/if}
		<button
			class="stop"
			onclick={stopFocusTimer}>Stop</button
		>
	</div>
{/if}

<style>
	@import '@mixins';

	.active {
		background: linear-gradient(155deg, color-mix(in oklch, var(--light_purple_bright) 80%, var(--white)) 0%, var(--light_purple_bright) 55%, color-mix(in oklch, var(--light_purple_bright) 80%, var(--black)) 100%);
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
		color: var(--white);
		row-gap: 10px;

		&.break {
			background: linear-gradient(155deg, color-mix(in oklch, var(--green) 80%, var(--white)) 0%, var(--green) 55%, color-mix(in oklch, var(--green) 80%, var(--black)) 100%);
			color: var(--green_text);
		}

		&.compact {
			grid-template-areas: 'timer desc' 'timer toggle';
			grid-template-columns: auto 1fr;

			.phase,
			.progress,
			.total_progress,
			.stop,
			.description,
			.permission {
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
			left: 1ch;
			text-align: center;
			width: 5ch;
		}
	}

	.permission {
		grid-area: label;
		align-self: start;

		& :global(button) {
			@include button_secondary;

			--button_text: var(--purple_bright_text);
			--button_border: var(--purple_bright_text);
		}

		&:hover {
			& :global(button) {
				--button_background: var(--purple_bright_text);
				--button_text: var(--purple_bright);
			}
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
		border-radius: 3px;

		&.break {
			opacity: 0.7;
		}
	}

	.progress,
	.segment {
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
				background: repeating-linear-gradient(45deg, rgba(245, 240, 240, 0.18) 0px, rgba(245, 240, 240, 0.18) 2px, var(--transparent) 2px, var(--transparent) 5px);
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

	.toggle,
	.compact_tog {
		@include button_secondary;

		--button_text: var(--purple_bright_text);
		--button_border: var(--purple_bright_text);

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
</style>
