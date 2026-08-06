<script lang="ts">
	import styles from './index.module.css';

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

<ol class="{styles.stepper} {className}">
	{#each steps as step, index (step)}
		<li
			class={[index < currentIndex && styles.done, index === currentIndex && styles.current]}
			aria-current={index === currentIndex ? 'step' : undefined}
		>
			{step}
		</li>
	{/each}
</ol>
