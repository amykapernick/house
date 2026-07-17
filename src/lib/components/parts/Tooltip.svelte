<script lang="ts">
	import type { Snippet } from "svelte";

	let {
		label,
		children,
		class: className = ''
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
		pressTimer = setTimeout(() => { visible = true; }, 500);
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
	<span class="tooltip" class:visible id={tooltipId} role="tooltip">{label}</span>
</span>

<style>
	.tooltip-trigger {
		display: inline-block;
		position: relative;
		cursor: default;
		user-select: none;
		user-select: none;
		-webkit-touch-callout: none;
	}

	.tooltip {
		position: absolute;
		z-index: 1;
		bottom: 100%;
		left: 50%;
		margin-bottom: 0.3em;
		padding: 0.2em 0.6em;
		transform: translateX(-50%);
		transition: opacity 0.15s ease;
		border-radius: 0.2em;
		opacity: 0;
		background: var(--black);
		color: var(--white);
		font-size: 0.75em;
		font-weight: 400;
		white-space: nowrap;
		pointer-events: none;
	}

	.tooltip-trigger:hover .tooltip,
	.tooltip-trigger:focus-within .tooltip,
	.tooltip.visible {
		opacity: 1;
	}
</style>
