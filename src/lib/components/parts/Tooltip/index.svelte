<script lang="ts">
	import type { Snippet } from 'svelte';
	import styles from './index.module.css';

	let {
		label,
		children,
		class: className = '',
	}: {
		label: string;
		children: Snippet;
		class?: string;
	} = $props();

	const tooltipId = $props.id();

	// Native title tooltips don't fire reliably on a mobile long-press, so
	// press-and-hold is handled manually alongside the CSS :hover/:focus tooltip.
	let visible = $state(false);
	let pressTimer: ReturnType<typeof setTimeout> | undefined;

	function startPress() {
		pressTimer = setTimeout(() => {
			visible = true;
		}, 500);
	}

	function endPress() {
		clearTimeout(pressTimer);
		visible = false;
	}
</script>

<span
	class="tooltip-trigger {className}"
	role="group"
	aria-describedby={tooltipId}
	ontouchstart={startPress}
	ontouchend={endPress}
	ontouchcancel={endPress}
>
	{@render children()}
	<span
		class={[styles.tooltip, visible && styles.visible]}
		id={tooltipId}
		role="tooltip">{label}</span
	>
</span>
