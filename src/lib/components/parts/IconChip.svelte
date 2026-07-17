<script lang="ts">
	import type { Colour } from "$types/global";
	import Icon from "./Icon.svelte";
	import type { IconName } from "./Icon.svelte";

	let {
		icon,
		label,
		class: className = ''
	}: {
		icon: IconName;
		label: string;
		colour?: Colour;
		class?: string;
	} = $props();
</script>

<div
	class="icon-chip {className}"
>
	<span class="icon" aria-hidden="true"><Icon name={icon} /></span>
	{label}
</div>

<style>
	.icon-chip {
		border: 1.5px solid currentColor;
		color: color-mix(in oklch, var(--orange) 74%, var(--black));
		display: inline-block;
		text-align: center;
		border-radius: 0.7em;
		padding: 0.7em 1em;
		font-weight: 600;
	}

	.icon {
		display: flex;
		margin: 0 auto 0.4em;
		justify-content: center;

		:global(svg) {
			width: auto;
			height: 1em;
		}
	}
</style>
