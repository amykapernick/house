<script lang="ts">
	import type { Component } from 'svelte';

	let {
		options,
		value,
		toggleFunction,
		name,
		class: className = ''
	}: {
		options: { label: string; Icon: Component<Record<string, any>> }[];
		value: number;
		toggleFunction: (index: number) => void;
		name: string;
		class?: string;
	} = $props();

	const switchId = $props.id();

</script>


<div class="container {className}" role="radiogroup" aria-label={name}>
	{#each options as {label, Icon}, index (label)}
		<input
			type="radio"
			id={`${switchId}_${label.replace(' ', '')}`}
			name={switchId}
			value={index}
			checked={value === index}
			onchange={() => toggleFunction(index)}
		/>
		<label for={`${switchId}_${label.replace(' ', '')}`}>
			<span class="label">{label}</span>
			<Icon class="icon" />
		</label>
	{/each}
	<span class="switch"></span>
</div>

<style>
	@import '@mixins';

	.container {
		--gap: 0.1em;
		--toggle: 0.8em;

		display: flex;
		position: relative;
		align-items: center;
		align-self: center;
		height: 1em;
		font-size: 1.5em;
		width: 2em;

		& .switch::before, & :global(label svg) {
			transition: all 5s ease-in-out;
		}

		&:global(:has(input[type="radio"][value="0"]:checked)) {
			& .switch::before, & :global(label svg) {
				right: auto;
				left: var(--gap);
			}
		}

		&:global(:has(input[type="radio"][value="1"]:checked)) {
			& .switch::before, & :global(label svg) {
				right: var(--gap);
				left: auto;
			}
		}

		& :global(input[type="radio"]:checked + label) {
			& :global(svg) {
				display: block;
			}
		}

		& :global(input[type="radio"]:not(:checked) + label::before) {
			content: '';
		}
	}

	.label, input[type="radio"] {

		@include sr_only;
	}

	label {
		font-size: 1em;
		z-index: 10;

		& :global(svg) {
			display: none;
			position: absolute;
			z-index: 2;
			top: var(--gap);
			width: auto;
			height: var(--toggle);
			padding: var(--gap);
			
		}

		&::before {
			position: absolute;
			z-index: 10;
			height: 100%;
			margin: 0;		
			cursor: pointer;
			inset: 0;
		}
	}

	.switch {
		display: block;
		width: 2em;
		height: 1em;
		border-radius: 1em;
		background: light-dark(#ded0bd, var(--purple_bright));
		z-index: 5;

		&::before {
			content: '';
			display: block;
			position: absolute;
			top: var(--gap);
			width: var(--toggle);
			height: var(--toggle);
			border-radius: 50%;
			background: var(--white);
		}
	}
</style>