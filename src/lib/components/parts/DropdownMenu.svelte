<script lang="ts">
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

<div class="dropdown {className}">
	<button type="button" class="trigger" popovertarget={menuId}>{label}</button>
	<div bind:this={menuEl} id={menuId} class="menu" popover>
		{#each items as item (item.label)}
			<button type="button" onclick={() => handleSelect(item.onClick)}>{item.label}</button>
		{/each}
	</div>
</div>

<style>
	@import '@mixins';

	.dropdown {
		display: inline-block;
		position: relative;
	}

	.trigger {

		@include button_secondary;
	}

	.menu {
		display: none;
		position: absolute;
		inset: 100% auto auto 0;
		flex-direction: column;
		width: max-content;
		margin: 0.3em 0 0;
		padding: 0;
		border: 1px solid var(--border);
		border-radius: 0.5em;
		background: var(--base_colour);
		box-shadow: light-dark(rgb(13 13 13 / 4%), rgb(0 0 0 / 30%)) 0 1px 2px, light-dark(rgb(95 65 50 / 9%), rgb(0 0 0 / 35%)) 0 8px 20px;

		&:popover-open {
			display: flex;
		}

		& button {
			padding: 0.5em 1em;
			border: none;
			border-radius: 0;
			background: none;
			color: inherit;
			font: inherit;
			text-align: left;
			cursor: pointer;

			&:hover {
				background: var(--purple_bright);
				color: var(--purple_bright_text);
			}
		}
	}
</style>
