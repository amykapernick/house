<script lang="ts">
	import styles from './index.module.css';

	let { class: className = '' }: { class?: string } = $props();
</script>

<footer class="{styles.footer} {className}"></footer>
