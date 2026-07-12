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

	let buttons: HTMLButtonElement[] = [];

	function focusTab(index: number) {
		const wrapped = (index + tabs.length) % tabs.length;
		buttons[wrapped]?.focus();
		onSelect(tabs[wrapped].id);
	}

	// Roving-tabindex keyboard pattern per https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
	function handleKeydown(event: KeyboardEvent, index: number) {
		switch (event.key) {
			case 'ArrowRight':
				event.preventDefault();
				focusTab(index + 1);
				break;
			case 'ArrowLeft':
				event.preventDefault();
				focusTab(index - 1);
				break;
			case 'Home':
				event.preventDefault();
				focusTab(0);
				break;
			case 'End':
				event.preventDefault();
				focusTab(tabs.length - 1);
				break;
		}
	}
</script>

<div class="tabs" role="tablist" aria-orientation="horizontal">
	{#each tabs as tab, index (tab.id)}
		<button
			bind:this={buttons[index]}
			type="button"
			role="tab"
			id="tab-{tab.id}"
			aria-selected={active === tab.id}
			aria-controls="panel-{tab.id}"
			data-active={active === tab.id}
			tabindex={active === tab.id ? 0 : -1}
			onclick={() => onSelect(tab.id)}
			onkeydown={(e) => handleKeydown(e, index)}
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
		opacity: 0.85;
		cursor: pointer;
		transition: opacity 0.15s, border-color 0.15s;

		&:hover {
			opacity: 1;
		}

		&[data-active='true'] {
			border-color: var(--purple_bright);
			opacity: 1;
		}

		&:focus-visible {
			outline: 2px solid var(--purple_bright);
			outline-offset: 2px;
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
