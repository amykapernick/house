<script
	lang="ts"
	generics="Item"
>
	import Search from '$img/icons/search-1.svg?component';
	import Pill from '../Pill/index.svelte';
	import styles from './index.module.css';
	const DEFAULT_MIN_CHARS = 2;
	const DEFAULT_DEBOUNCE_MS = 250;

	let {
		id,
		label,
		value = $bindable(''),
		onSearch,
		onSelect,
		getKey,
		getLabel,
		getBadge,
		minChars = DEFAULT_MIN_CHARS,
		debounceMs = DEFAULT_DEBOUNCE_MS,
		placeholder,
		noResultsText = 'No matches',
		class: className = '',
		hiddenLabel = false,
	}: {
		id: string;
		label: string;
		value?: string;
		onSearch: (query: string) => Promise<Item[]>;
		onSelect: (item: Item) => void;
		getKey: (item: Item) => string;
		getLabel: (item: Item) => string;
		getBadge?: (item: Item) => string | undefined;
		minChars?: number;
		debounceMs?: number;
		placeholder?: string;
		noResultsText?: string;
		class?: string;
		hiddenLabel?: boolean;
	} = $props();

	let results = $state<Item[]>([]);
	let searching = $state(false);
	let searchToken = 0;
	let debounceTimer: ReturnType<typeof setTimeout> | undefined;

	async function runSearch(term: string, token: number) {
		searching = true;
		const found = await onSearch(term);
		if (token !== searchToken) return; // a newer search superseded this one
		results = found;
		searching = false;
	}

	$effect(() => {
		const term = value.trim();
		clearTimeout(debounceTimer);
		searchToken += 1;
		if (term.length < minChars) {
			results = [];
			searching = false;
			return;
		}
		const token = searchToken;
		debounceTimer = setTimeout(() => runSearch(term, token), debounceMs);
		return () => clearTimeout(debounceTimer);
	});

	function select(item: Item) {
		onSelect(item);
		value = '';
		results = [];
	}
</script>

<label
	class={hiddenLabel ? 'sr-only' : ''}
	for={id}>{label}</label
>
<div class={styles.search}>
	<input
		{id}
		class={className}
		type="text"
		bind:value
		{placeholder}
		autocomplete="off"
	/>
	<!-- TODO: Tie search function to button as well -->
	<button type="submit">
		<Search />
		<span class="sr-only">Search</span>
	</button>
	{#if value.trim().length >= minChars}
		<ul class={styles.results}>
			{#each results as item (getKey(item))}
				<li>
					<button
						type="button"
						onclick={() => select(item)}
					>
						<span class={styles.name}>{getLabel(item)}</span>
						{#if getBadge?.(item)}
							<Pill
								class="tag"
								outline={true}>{getBadge(item)}</Pill
							>
						{/if}
					</button>
				</li>
			{/each}
			{#if searching && results.length === 0}
				<li class={styles.hint}>Searching...</li>
			{/if}
			{#if !searching && results.length === 0}
				<li class={styles.hint}>{noResultsText}</li>
			{/if}
		</ul>
	{/if}
</div>
