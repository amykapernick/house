<script lang="ts">
	interface Tab {
		id: string;
		label: string;
	}

	const {
		tabs,
		active,
		onSelect,
	}: {
		tabs: Tab[];
		active: string;
		onSelect: (id: string) => void;
	} = $props();
</script>

<div class="tabs" role="tablist">
	{#each tabs as tab (tab.id)}
		<button
			type="button"
			role="tab"
			id="tab-{tab.id}"
			aria-selected={active === tab.id}
			aria-controls="panel-{tab.id}"
			data-active={active === tab.id}
			onclick={() => onSelect(tab.id)}
		>
			{tab.label}
		</button>
	{/each}
</div>

<style>
	@import '@mixins';

	.tabs {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25em;
		margin: 1.5em 0 1em;
		border-bottom: 2px solid var(--grey_light);
	}

	button {
		margin-bottom: -2px;
		padding: 0.6em 1em;
		border: none;
		border-bottom: 2px solid transparent;
		background: none;
		color: var(--navy);
		font-size: 1em;
		font-weight: 600;
		text-transform: capitalize;
		opacity: 0.6;
		cursor: pointer;
		transition: opacity 0.15s, border-color 0.15s;

		&:hover {
			opacity: 0.85;
		}

		&[data-active='true'] {
			border-color: var(--purple_bright);
			opacity: 1;
		}
	}

	@media (width <= 50em) {
		.tabs {
			flex-wrap: nowrap;
			overflow-x: auto;
			-webkit-overflow-scrolling: touch;
		}

		button {
			flex-shrink: 0;
		}
	}
</style>
