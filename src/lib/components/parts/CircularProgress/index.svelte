<script lang="ts">
	import styles from './index.module.css';

	let {
		progress,
		size = 32,
		strokeWidth = 3,
		label,
		class: className = '',
	}: {
		progress: number;
		size?: number;
		strokeWidth?: number;
		label?: string;
		class?: string;
	} = $props();

	let clamped = $derived(Math.min(1, Math.max(0, progress)));
	let radius = $derived((size - strokeWidth) / 2);
	let circumference = $derived(2 * Math.PI * radius);
	let offset = $derived(circumference * (1 - clamped));
</script>

<svg
	class="{styles.circular_progress} {className}"
	viewBox="0 0 {size} {size}"
	style="width: var(--circular_progress_size, {size}px); height: var(--circular_progress_size, {size}px);"
	role="progressbar"
	aria-label={label}
	aria-valuenow={Math.round(clamped * 100)}
	aria-valuemin="0"
	aria-valuemax="100"
>
	<circle class={styles.track} cx={size / 2} cy={size / 2} r={radius} stroke-width={strokeWidth} fill="none" />
	<circle
		class={styles.value}
		cx={size / 2}
		cy={size / 2}
		r={radius}
		stroke-width={strokeWidth}
		fill="none"
		stroke-dasharray={circumference}
		stroke-dashoffset={offset}
	/>
</svg>
