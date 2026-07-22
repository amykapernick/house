<script lang="ts">
	import { format, parseISO } from 'date-fns';
	import { resolve } from '$app/paths';
	import { DATE_FORMATS } from '$utils/dateFormats';
	import ContentIcon from '$components/parts/ContentIcon.svelte';
	import type { ContentEntry } from '$types/generated';
	import Completed from '$img/icons/s-check.svg?component'

	export type EntryStatus = { total: number | null, read: number };

	// `archived` links to /content/archive/[slug] instead of /content/[slug],
	// and shows the archived-version count in place of read progress (which
	// has no meaning for a slug's archived versions) - the only difference
	// between how a card looks on /content vs /content/archive.
	let { entry, status, archived = false }: { entry: ContentEntry; status?: EntryStatus; archived?: boolean } = $props();
</script>

<li class="card">
	<ContentIcon icon={entry.icon} iconType={entry.iconType} />
		{#if archived}
			<a class="title" href={resolve(`/content/archive/[slug]`, { slug: entry.slug ?? `` })}>{entry.title}</a>
			<span class="progress">{entry.archivedCount} archived {entry.archivedCount === 1 ? `version` : `versions`}</span>
		{:else}
			<a class="title" href={resolve(`/content/[slug]`, { slug: entry.slug ?? `` })}>{entry.title}</a>
			{#if entry.summary}
				<p class="desc">{entry.summary}</p>
			{/if}
			{#if entry.brief && !status?.total}
				<span class="progress">No versions yet</span>
			{:else if status?.total}
				<span class="progress" class:complete={status.read >= status.total}>
					<span class="count">{status.read}/{status.total} <span class="sr-only">sections read</span></span>
					{#if status.read >= status.total}<Completed />{/if}
				</span>
			{/if}
		{/if}
		{#if entry.updatedAt}
			<span class="updated"><span class="sr-only">Updated</span> {format(parseISO(entry.updatedAt), DATE_FORMATS.full)}</span>
		{/if}
</li>

<style>
	@import '@mixins';

	.card {

		@include theme_gradient(--navy);

		display: grid;
		position: relative;
		grid-template-areas: 'icon title' 'desc desc' 'sects date';
		grid-template-columns: auto 1fr;
		grid-template-rows: auto 1fr auto;
		align-items: center;
		padding: 0.8em 1.2em;
		border-radius: 0.5em;
		color: var(--navy_text);
		font-weight: 600;
		text-decoration: none;
		gap: 0.6em;

		&:hover {

			@include theme_gradient(--purple);
		}
	}

	.title {
			grid-area: title;
			color: inherit;
			text-decoration: none;

			&::before {
				content: '';
				position: absolute;
				cursor: pointer;
				inset: 0;
			}
		}

	.desc {
		grid-area: desc;
		margin: 0;
		font-size: 0.85em;
		font-weight: 400;
	}

	.updated, .progress {
		margin: 0;
		font-size: 0.8em;
		font-weight: 400;
		text-align: right;
	}

	.updated {
		grid-area: date;
	}

	.progress {
		grid-area: sects;

		&.complete {
			font-weight: 600;

			& .count {

				@include sr_only;
			}
		}
	}
</style>
