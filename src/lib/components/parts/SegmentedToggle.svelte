<script lang="ts" generics="Value extends string">
	let {
		legend,
		name,
		options,
		value = $bindable(),
		onchange,
		class: className = ''
	}: {
		legend: string;
		name: string;
		options: { value: Value; label: string }[];
		value: Value;
		onchange?: () => void;
		class?: string;
	} = $props();
</script>

<fieldset class="{className}">
	<legend class="sr-only">{legend}</legend>
	<div class="segments">
		{#each options as option (option.value)}
			<input
				type="radio"
				id="{name}-{option.value}"
				{name}
				value={option.value}
				bind:group={value}
				{onchange}
			/>
			<label for="{name}-{option.value}" class:active={value === option.value}>
				{option.label}
			</label>
		{/each}
	</div>
</fieldset>

<style>
	@import '@mixins';

	.segments {
		display: flex;
		justify-content: start;
		width: max-content;
		overflow: hidden;
		border: 1px solid currentColor;
		border-radius: 0.5em;
		color: var(--purple_bright);
		gap: 0
	}

	input {

		@include sr_only;

		&:checked {
			& + label {
				background: var(--purple_bright);
				color: var(--purple_bright_text);
			}
		}
	}

	label {
		padding: 0.5em 1em;
		border-left-width: 0;
		color: inherit;
		cursor: pointer;

		&:not(:first-of-type) {
			border-left: inherit;
		}

		&:hover {
			text-decoration: underline;
		}
	}
</style>
