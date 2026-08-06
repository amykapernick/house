<script lang="ts">
	import { focusTimerState, pauseFocusTimer, resumeFocusTimer, stopFocusTimer, formatRemaining } from '$utils/focusTimer';
	import CircularProgress from '../CircularProgress/index.svelte';
	import type { Snippet } from 'svelte';
	import styles from './index.module.css';

	let { open = $bindable(false), children }: { open?: boolean; children?: Snippet } = $props();

	let currentPhase = $derived($focusTimerState?.phases[$focusTimerState.phaseIndex] ?? null);

	let remainingMs = $derived($focusTimerState ? ($focusTimerState.paused ? $focusTimerState.pausedRemainingMs : Math.max(0, $focusTimerState.phaseEndAt - Date.now())) : 0);

	let blocksToGo = $derived($focusTimerState ? $focusTimerState.phases.slice($focusTimerState.phaseIndex + 1).filter((phase) => phase.type === `work`).length : 0);

	let currentPhaseElapsedSeconds = $derived(currentPhase ? Math.max(0, Math.min(currentPhase.seconds, currentPhase.seconds - remainingMs / 1000)) : 0);
</script>

{#if $focusTimerState && currentPhase}
	<div
		class={[styles.active, currentPhase.type === `break` && styles.break, !open && styles.compact]}
	>
		<span class={styles.permission}>{@render children?.()}</span>
		<button
			class={styles.compact_tog}
			onclick={() => (open = !open)}>{open ? `Condense` : `Expand`}</button
		>
		<span class={styles.phase}>{currentPhase.label}</span>
		<span class={styles.time}>
			<CircularProgress
				progress={currentPhase.seconds > 0 ? currentPhaseElapsedSeconds / currentPhase.seconds : 0}
				size={28}
				strokeWidth={3}
				label="{currentPhase.label} progress"
			/>
			<div>{formatRemaining(remainingMs)}</div>
		</span>
		{#if blocksToGo > 0}
			<span class={styles.description}>{blocksToGo} block{blocksToGo === 1 ? `` : `s`} to go</span>
		{/if}
		<progress
			class={styles.progress}
			value={currentPhaseElapsedSeconds}
			max={currentPhase.seconds}
		>
			{Math.round((currentPhaseElapsedSeconds / currentPhase.seconds) * 100)}%
		</progress>
		<div class={styles.total_progress}>
			{#each $focusTimerState.phases as phase, i (i)}
				<progress
					class={[styles.segment, phase.type === `break` && styles.break]}
					style="flex-grow: {phase.seconds}"
					value={i < $focusTimerState.phaseIndex ? phase.seconds : i === $focusTimerState.phaseIndex ? currentPhaseElapsedSeconds : 0}
					max={phase.seconds}
				></progress>
			{/each}
		</div>
		{#if $focusTimerState.paused}
			<button
				class={styles.toggle}
				onclick={resumeFocusTimer}>Resume</button
			>
		{:else}
			<button
				class={styles.toggle}
				onclick={pauseFocusTimer}>Pause</button
			>
		{/if}
		<button
			class={styles.stop}
			onclick={stopFocusTimer}>Stop</button
		>
	</div>
{/if}
