<script lang="ts">
	import type { User } from '$types/global';

	let { assignees = [], className = '' }: { assignees: User[]; className?: string } = $props();
</script>

<ul class="list {className}">
	{#each assignees as { slug, name, profile } (slug)}
		<li class="item">
			<span class="sr-only">{name}</span>
			{#if profile}
				<img class="image" src={profile} alt="" />
			{:else}
				<span class="image">
					{name
						.split(' ')
						.map((word) => word[0])
						.join('')}
				</span>
			{/if}
		</li>
	{/each}
</ul>

<style>
	.list {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(1em, 1fr));
		margin: 0;
		padding: 0;
		font-size: 1.5em;
		gap: 5px;
	}

	.item {
		width: 1em;
		height: 1em;
		margin: 0;
		padding: 0;
		overflow: hidden;
		border-radius: 50%;
		line-height: 1;
	}

	.image {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
</style>
