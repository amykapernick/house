<script lang="ts">
	import styles from './index.module.css';

	const {
		data,
		class: className = '',
	}: {
		data: unknown;
		class?: string;
	} = $props();
</script>

<pre class="{styles.root} {className}"><code>{JSON.stringify(data, null, 2)}</code></pre>
