<script lang="ts">
	let {
		rows = 3,
		class: className = ''
	}: {
		rows?: number;
		class?: string;
	} = $props();
</script>

<div class="skeleton {className}" aria-hidden="true">
	{#each { length: rows } as _, index (index)}
		<div class="line"></div>
	{/each}
</div>

<style>
	.skeleton {
		display: flex;
		flex-direction: column;
		gap: 0.6em;
	}

	.line {
		height: 1em;
		border-radius: 0.3em;
		background: linear-gradient(90deg, var(--grey_light) 25%, var(--neutral_light) 50%, var(--grey_light) 75%);
		background-size: 200% 100%;
		animation: shimmer 1.4s ease-in-out infinite;

		&:last-child {
			width: 60%;
		}
	}

	@keyframes shimmer {
		0% { background-position: 200% 0; }
		100% { background-position: -200% 0; }
	}
</style>
