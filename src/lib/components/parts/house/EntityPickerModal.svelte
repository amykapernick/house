<script lang="ts" generics="T extends { id: string }">
	import type { Snippet } from 'svelte';
	import Modal from '$parts/Modal.svelte';

	let {
		open = $bindable(false),
		title,
		entities,
		emptyMessage,
		onPick,
		label,
	}: {
		open?: boolean;
		title: string;
		entities: T[];
		emptyMessage: Snippet;
		onPick: (entity: T) => void;
		label: Snippet<[T]>;
	} = $props();
</script>

<Modal bind:open {title}>
	{#if entities.length === 0}
		<p>{@render emptyMessage()}</p>
	{:else}
		<ul class="picker_list">
			{#each entities as entity (entity.id)}
				<li>
					<button type="button" onclick={() => onPick(entity)}>
						{@render label(entity)}
					</button>
				</li>
			{/each}
		</ul>
	{/if}
	<button type="button" onclick={() => (open = false)}>Cancel</button>
</Modal>

<style>
	.picker_list {
		margin: 0 0 1em;
		padding: 0;
		list-style: none;
		max-height: 50vh;
		overflow-y: auto;

		& li {
			margin: 0;
		}

		& button {
			display: flex;
			flex-direction: column;
			align-items: flex-start;
			width: 100%;
			padding: 0.5em 0.75em;
			border: none;
			background: none;
			text-align: left;
			cursor: pointer;

			&:hover {
				background: color-mix(in srgb, var(--purple_bright) 8%, transparent);
			}
		}
	}
</style>
