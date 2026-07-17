<script lang="ts">
	let {
		currentPage,
		totalPages,
		onPageChange,
	}: {
		currentPage: number;
		totalPages: number;
		onPageChange: (page: number) => void;
	} = $props();
</script>

{#if totalPages > 1}
	<nav class="pagination">
		<button disabled={currentPage <= 1} onclick={() => onPageChange(currentPage - 1)}>Previous</button>
		<span>Page {currentPage} of {totalPages}</span>
		<button disabled={currentPage >= totalPages} onclick={() => onPageChange(currentPage + 1)}>Next</button>
	</nav>
{/if}

<style>
	.pagination {
		display: flex;
		align-items: center;
		justify-content: center;
		margin-top: 2em;
		padding: 1em 0;
		gap: 1em;

		& button {
			padding: 0.5em 1em;
			border: 1px solid var(--grey_light);
			border-radius: 0.3em;
			background: var(--transparent);
			color: var(--black);
			cursor: pointer;

			&:disabled {
				opacity: 0.4;
				cursor: default;
			}
		}

		& span {
			color: var(--grey);
			font-size: 0.9em;
		}
	}
</style>
