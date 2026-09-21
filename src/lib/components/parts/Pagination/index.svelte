<script lang="ts">
	import styles from './index.module.css';

	let {
		currentPage,
		totalPages,
		onPageChange,
	}: {
		currentPage: number;
		totalPages: number;
		onPageChange: (page: number) => void;
	} = $props();

	// Always keeps the first/last page and a couple of neighbours around the
	// current page visible, collapsing everything else behind an ellipsis -
	// near either end that naturally expands into a run of 5 leading/trailing
	// numbers (eg. 1 2 3 4 5 … 86) rather than a lone number next to the gap.
	function pageNumbers(current: number, total: number): (number | `…`)[] {
		if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- built and discarded synchronously within this function, never read reactively
		const pages = new Set<number>([1, total]);
		for (let i = current - 1; i <= current + 1; i++) {
			if (i >= 1 && i <= total) pages.add(i);
		}
		if (current <= 3) for (let i = 1; i <= 5; i++) pages.add(i);
		if (current >= total - 2) for (let i = total - 4; i <= total; i++) pages.add(i);

		const sorted = [...pages].sort((a, b) => a - b);
		const result: (number | `…`)[] = [];
		let previous = 0;
		for (const page of sorted) {
			if (previous && page - previous > 1) result.push(`…`);
			result.push(page);
			previous = page;
		}
		return result;
	}
</script>

{#if totalPages > 1}
	<nav
		class={styles.pagination}
		aria-label="Pagination"
	>
		<button
			type="button"
			class={styles.nav}
			disabled={currentPage <= 1}
			onclick={() => onPageChange(currentPage - 1)}
		>← Prev</button>
		{#each pageNumbers(currentPage, totalPages) as page, i (`${page}-${i}`)}
			{#if page === `…`}
				<span class={styles.ellipsis}>…</span>
			{:else}
				<button
					type="button"
					class={[styles.page, page === currentPage && styles.active]}
					aria-current={page === currentPage ? `page` : undefined}
					onclick={() => onPageChange(page)}
				>{page}</button>
			{/if}
		{/each}
		<button
			type="button"
			class={styles.nav}
			disabled={currentPage >= totalPages}
			onclick={() => onPageChange(currentPage + 1)}
		>Next →</button>
	</nav>
{/if}
