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
		display: grid;
		grid-template-areas:
			'label timer desc desc'
			'prog prog prog prog'
			'total total total total'
			'toggle toggle toggle stop';
		grid-template-columns: auto auto 1fr auto;
		align-items: center;
		padding: 1em;
		gap: 10px 20px;
		border-radius: 0.8em;
		background: linear-gradient(155deg, color-mix(in oklch, var(--light_purple_bright) 80%, var(--white)) 0%, var(--light_purple_bright) 55%, color-mix(in oklch, var(--light_purple_bright) 80%, var(--black)) 100%);
		color: var(--white);

		&.break {
			background: linear-gradient(155deg, color-mix(in oklch, var(--green) 80%, var(--white)) 0%, var(--green) 55%, color-mix(in oklch, var(--green) 80%, var(--black)) 100%);
			color: var(--green_text);
		}

		&.compact {
			grid-template-areas: 'timer desc' 'timer toggle';
			grid-template-columns: auto 1fr;

			& .phase,
			& .progress,
			& .total_progress,
			& .stop,
			& .description,
			& .permission {
				display: none;
			}

			& .time {
				font-size: 0.8em;
			}
		}
	}

	.phase {
		grid-area: label;
		align-self: end;
		font-size: 0.8em;
		font-weight: 800;
		text-transform: uppercase;
	}

	.time {
		--circular_progress_size: 7ch;

		display: grid;
		position: relative;
		grid-area: timer;
		place-content: center center;
		align-items: center;
		font-size: 1.2em;
		font-weight: 700;
		font-variant-numeric: tabular-nums;

		& div {
			position: absolute;
			left: 1ch;
			width: 5ch;
			text-align: center;
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
		grid-area: desc;
		font-size: 0.85em;
		font-weight: 700;
		text-align: right;
	}

	.progress {
		grid-area: prog;
		width: 100%;
		height: 0.5em;
		border-radius: 2em;
	}

	.total_progress {
		display: flex;
		grid-area: total;
		width: 100%;
		gap: 3px;
	}

	.segment {
		flex-basis: 0;
		flex-shrink: 0;
		min-width: 4px;
		height: 1em;
		border-radius: 3px;

		&.break {
			opacity: 0.7;
		}
	}

	.progress,
	.segment {
		overflow: hidden;
		border: none;
		color: inherit;
		appearance: none;
		appearance: none;

		&::-webkit-progress-bar {
			border-radius: inherit;
			background: rgb(255 255 255 / 25%);
		}

		&.break {
			&::-webkit-progress-bar {
				background: repeating-linear-gradient(45deg, rgb(245 240 240 / 18%) 0, rgb(245 240 240 / 18%) 2px, var(--transparent) 2px, var(--transparent) 5px);
			}

			&::-webkit-progress-value {
				background: rgb(245 240 240 / 55%);
			}

			&::-moz-progress-bar {
				background: rgb(245 240 240 / 55%);
			}
		}

		&::-webkit-progress-value {
			transition: width 0.3s linear;
			border-radius: inherit;
			background: currentColor;
		}

		&::-moz-progress-bar {
			border-radius: inherit;
			background: currentColor;
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
		place-self: start end;
	}
</style>
