<script lang="ts">
	import { format, parseISO } from 'date-fns';
	import { resolve } from '$app/paths';
	import ContentIcon from '$components/parts/ContentIcon.svelte';
	import type { ContentEntry } from '$types/generated';
	import Completed from '$img/icons/s-check.svg'

	export type EntryStatus = { total: number | null, read: number };

	let { entry, status }: { entry: ContentEntry; status?: EntryStatus } = $props();
</script>

<li class="card">
	<ContentIcon icon={entry.icon} iconType={entry.iconType} />
		<a class="title" href={resolve(`/content/[slug]`, { slug: entry.slug ?? `` })}>{entry.title}</a>
		{#if entry.brief && !status?.total}
			<span class="progress">No versions yet</span>
		{:else if status?.total}
			<span class="progress" class:complete={status.read >= status.total}>
				<span class="count">{status.read}/{status.total} <span class="sr-only">sections read</span></span>
				{#if status.read >= status.total}<Completed />{/if}
			</span>
		{/if}
		{#if entry.updatedAt}
			<span class="updated"><span class="sr-only">Updated</span> {format(parseISO(entry.updatedAt), `d MMM yyyy`)}</span>
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
