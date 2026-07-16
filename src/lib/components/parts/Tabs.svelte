<script lang="ts">
	interface Tab {
		id: string;
		label: string;
	}

	const {
		tabs,
		active,
		onSelect,
		class: className = '',
	}: {
		tabs: Tab[];
		active: string;
		onSelect: (id: string) => void;
		class?: string;
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

<div class="tabs {className}" role="tablist" aria-orientation="horizontal">
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
		gap: 1em 1.5em;
		margin: 1.5em 0 1em;
		padding-bottom: 0.8em;
		border-bottom: 1px solid color-mix(in oklch, rgb(247, 240, 235) 78%, rgb(13, 13, 13));
	}

	button {
		margin: 0;
		padding: 0;
		border: none;
		background: none;
		color: color-mix(in oklch, rgb(96, 96, 96) 84%, rgb(13, 13, 13));
		font-size: 1em;
		font-weight: 600;
		text-transform: capitalize;
		cursor: pointer;
		border-radius: 0.2em;
		flex-shrink: 0;

		&:hover {
			text-decoration: underline;
		}

		&[data-active='true'] {
			color: var(--navy);
			opacity: 1;
		}

		&:focus-visible {
			outline: 2px solid var(--purple_bright);
			outline-offset: 2px;
		}
	}
</style>
