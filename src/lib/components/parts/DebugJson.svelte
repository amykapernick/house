<script lang="ts">
	const {
		data,
		class: className = '',
	}: {
		data: unknown;
		class?: string;
	} = $props();
</script>

<pre class={className}><code>{JSON.stringify(data, null, 2)}</code></pre>

<style>
	pre {
		padding: 1em;
		overflow-x: auto;
		border-radius: 0.3em;
		background: var(--blue);
		color: var(--blue_text);
		font-size: 0.85em;
		line-height: 1.4;
	}
</style>
