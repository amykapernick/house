<script lang="ts">
	import type { User } from '$types/global';
	import styles from './index.module.css';

	let { assignees = [], class: className = '' }: { assignees: User[]; class?: string } = $props();
</script>

<ul class="{styles.list} {className}">
	{#each assignees as { slug, name, profile } (slug)}
		<li class={styles.item}>
			<span class="sr-only">{name}</span>
			{#if profile}
				<img class={styles.image} src={profile} alt="" />
			{:else}
				<span class={styles.image}>
					{name
						.split(' ')
						.map((word) => word[0])
						.join('')}
				</span>
			{/if}
		</li>
	{/each}
</ul>
