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
		border-bottom: 1px solid color-mix(in oklch, var(--background) 78%, var(--black));
	}

	button {
		flex-shrink: 0;
		margin: 0;
		padding: 0;
		border: none;
		border-radius: 0.2em;
		background: none;
		color: var(--text_secondary);
		font-size: 1em;
		font-weight: 600;
		text-transform: capitalize;
		cursor: pointer;

		&:hover {
			text-decoration: underline;
		}

		&[data-active='true'] {
			opacity: 1;
			color: var(--navy);
		}

		&:focus-visible {
			outline: 2px solid var(--purple_bright);
			outline-offset: 2px;
		}
	}
</style>
