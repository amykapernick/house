<script lang="ts">
	import styles from './index.module.css';

	let {
		rows = 3,
		class: className = ''
	}: {
		rows?: number;
		class?: string;
	} = $props();
</script>

<div class="{styles.skeleton} {className}" aria-hidden="true">
	{#each { length: rows } as _, index (index)}
		<div class={styles.line}></div>
	{/each}
</div>
