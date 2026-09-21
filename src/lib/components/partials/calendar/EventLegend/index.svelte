<script lang="ts">
	import styles from './index.module.css';

	let { class: className = '' }: { class?: string } = $props();
</script>

<ul class="{styles.legend} {className}">
	<li class={styles.event}>Event</li>
	<li class={styles.task}>Task</li>
</ul>
