<script
	lang="ts"
	generics="T extends { id: string }"
>
	import type { Snippet } from 'svelte';
	import Modal from '$parts/Modal/index.svelte';
	import type { ModalAction } from '$parts/Modal/index.svelte';
	import styles from './index.module.css';

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

	let modalActions: ModalAction[] = $derived([
		{ label: `Cancel`, onclick: () => (open = false), style: `secondary`, variant: `danger` },
	]);
</script>

<Modal
	bind:open
	{title}
	actions={modalActions}
>
	{#if entities.length === 0}
		<p>{@render emptyMessage()}</p>
	{:else}
		<ul class={styles.picker_list}>
			{#each entities as entity (entity.id)}
				<li>
					<button
						type="button"
						onclick={() => onPick(entity)}
					>
						{@render label(entity)}
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</Modal>
