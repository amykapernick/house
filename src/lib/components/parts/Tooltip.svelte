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
		position: relative;
		display: inline-block;
		cursor: default;
		-webkit-touch-callout: none;
		-webkit-user-select: none;
		user-select: none;
	}

	.tooltip {
		position: absolute;
		bottom: 100%;
		left: 50%;
		z-index: 1;
		padding: 0.2em 0.6em;
		margin-bottom: 0.3em;
		transform: translateX(-50%);
		transition: opacity 0.15s ease;
		white-space: nowrap;
		border-radius: 0.2em;
		background: var(--black);
		color: var(--white);
		font-size: 0.75em;
		font-weight: 400;
		opacity: 0;
		pointer-events: none;
	}

	.tooltip-trigger:hover .tooltip,
	.tooltip-trigger:focus-within .tooltip,
	.tooltip.visible {
		opacity: 1;
	}
</style>
