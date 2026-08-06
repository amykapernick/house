<script lang="ts">
	import styles from './index.module.css';

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

<div
	class="{styles.tabs} {className}"
	role="tablist"
	aria-orientation="horizontal"
>
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
