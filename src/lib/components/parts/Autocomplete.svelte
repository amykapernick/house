<script lang="ts" generics="Item">
	import Search from '$img/icons/search.svg?component';
	import Pill from './Pill.svelte';
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
		hiddenLabel = false
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

<label class={hiddenLabel ? 'sr-only' : ''} for={id}>{label}</label>
<div class="search">
	<input {id} class={className} type="text" bind:value {placeholder} autocomplete="off" />
	<!-- TODO: Tie search function to button as well -->
	<button type="submit">
		<Search />
		<span class="sr-only">Search</span>
	</button>
	{#if value.trim().length >= minChars}
		<ul class="results">
			{#each results as item (getKey(item))}
				<li>
					<button type="button" onclick={() => select(item)}>
						<span class="name">{getLabel(item)}</span>
						{#if getBadge?.(item)}
							<Pill class="tag" outline={true}>{getBadge(item)}</Pill>
						{/if}
					</button>
				</li>
			{/each}
			{#if searching && results.length === 0}
				<li class="hint">Searching...</li>
			{/if}
			{#if !searching && results.length === 0}
				<li class="hint">{noResultsText}</li>
			{/if}
		</ul>
	{/if}
</div>

<style>
	@import '@mixins';

	.search {
		display: grid;
		grid-template-columns: 1fr auto;
		width: 100%;
		margin: 0.1em 0 1em;
		border: 1px solid var(--input_border);
		border-radius: 0.5em;
		background: var(--input_bg);
		box-shadow: none;
		color: light-dark(
			var(--black), 
			color-mix(in oklch, var(--white) 92%, var(--black))
		);
		line-height: 1.5;
		
		&:focus-within {
			border-color: var(--purple_bright);
			outline: 2px dotted var(--green);
		}

		& input {
			margin: 0;
			border: none;
			background: inherit;
			
			&:focus {
				outline: none;
			}
		}

		& button[type="submit"] {

			@include button_icon;

			@include button_secondary;

			height: 100%;
			border: none;
			border-radius: inherit;
			border-top-left-radius: 0;
			border-bottom-left-radius: 0;
			font-size: 1.5em;

			& :global(svg) {
				width: 1em;
				height: auto;
			}
		}
	}

	.results {
		grid-column: 1 / -1;
		max-height: 200px;
		margin: 0.3em 0 0;
		padding: 0;
		overflow-y: auto;
		border-top: 1.2px solid var(--purple_bright);
		border-radius: 0 0 0.5em 0.5em;
		background: var(--white_true);
		list-style: none;

		& button {

			@include button_text;

			display: flex;
			align-items: center;
			width: 100%;
			padding: 0.5em 1em;
			border-radius: 0;
			color: inherit;
			gap: 10px;

			&:hover {
				background: var(--gradient_nav_active_bg);
				text-decoration: none;
			}
		}

		& li:last-of-type {
			& button {
				border-radius: 0 0 0.5em 0.5em;
			}
		}

		& .name {
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		& :global(.tag) {
			font-size: 0.7em;
		}

		& .hint {
			padding: 0.5em 1em;
			color: var(--grey);
		}
	}
</style>
