<script lang="ts">
	import styles from './index.module.css';

	let {
		label,
		items,
		class: className = ''
	}: {
		label: string;
		items: { label: string; onClick: () => void }[];
		class?: string;
	} = $props();

	const menuId = $props.id();
	let menuEl: HTMLDivElement | undefined = $state();

	function handleSelect(onClick: () => void) {
		menuEl?.hidePopover();
		onClick();
	}
</script>

<div class="{styles.dropdown} {className}">
	<button type="button" class={styles.trigger} popovertarget={menuId}>{label}</button>
	<div bind:this={menuEl} id={menuId} class={styles.menu} popover>
		{#each items as item (item.label)}
			<button type="button" onclick={() => handleSelect(item.onClick)}>{item.label}</button>
		{/each}
	</div>
</div>
