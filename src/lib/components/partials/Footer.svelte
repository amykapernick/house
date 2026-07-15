<script lang="ts">
	let { class: className = '' }: { class?: string } = $props();
</script>

<footer class="footer {className}"></footer>

<style>
	.footer {
		grid-area: footer;
	}
</style>
