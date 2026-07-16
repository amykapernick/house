<script lang="ts">
	let {
		steps,
		currentIndex,
		class: className = ''
	}: {
		steps: string[];
		currentIndex: number;
		class?: string;
	} = $props();
</script>

<ol class="stepper {className}">
	{#each steps as step, index (step)}
		<li
			class:done={index < currentIndex}
			class:current={index === currentIndex}
			aria-current={index === currentIndex ? 'step' : undefined}
		>
			{step}
		</li>
	{/each}
</ol>

<style>
	.stepper {
		display: flex;
		flex-wrap: wrap;
		margin: 0;
		padding: 0;
		list-style: none;
		gap: 0;
		counter-reset: step;
	}

	li {
		display: flex;
		align-items: center;
		padding: 0.4em 1em 0.4em 0;
		color: var(--grey);
		font-size: 0.9em;
		font-weight: 600;
		counter-increment: step;

		&::before {
			content: counter(step);
			display: flex;
			align-items: center;
			justify-content: center;
			width: 1.6em;
			height: 1.6em;
			margin-right: 0.5em;
			border-radius: 50%;
			background: var(--grey_light);
			color: var(--black);
			font-size: 0.85em;
		}

		&.done {
			color: var(--purple_bright);

			&::before {
				background: var(--purple_bright);
				color: var(--purple_bright_text);
			}
		}

		&.current {
			color: var(--black);

			&::before {
				outline: 2px solid var(--purple_bright);
				outline-offset: 2px;
			}
		}
	}
</style>
