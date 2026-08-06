<script lang="ts">
	import { format, parseISO } from 'date-fns';
	import { resolve } from '$app/paths';
	import { DATE_FORMATS } from '$utils/dateFormats';
	import ContentIcon from '$components/parts/ContentIcon/index.svelte';
	import type { ContentEntry } from '$types/generated';
	import Completed from '$img/icons/s-check.svg?component'
	import styles from './index.module.css';

	export type EntryStatus = { total: number | null, read: number };

	// `archived` links to /content/archive/[slug] instead of /content/[slug],
	// and shows the archived-version count in place of read progress (which
	// has no meaning for a slug's archived versions) - the only difference
	// between how a card looks on /content vs /content/archive.
	let { entry, status, archived = false }: { entry: ContentEntry; status?: EntryStatus; archived?: boolean } = $props();
</script>

<li class={styles.card}>
	<ContentIcon icon={entry.icon} iconType={entry.iconType} />
		{#if archived}
			<a class={styles.title} href={resolve(`/content/archive/[slug]`, { slug: entry.slug ?? `` })}>{entry.title}</a>
			<span class={styles.progress}>{entry.archivedCount} archived {entry.archivedCount === 1 ? `version` : `versions`}</span>
		{:else}
			<a class={styles.title} href={resolve(`/content/[slug]`, { slug: entry.slug ?? `` })}>{entry.title}</a>
			{#if entry.summary}
				<p class={styles.desc}>{entry.summary}</p>
			{/if}
			{#if entry.brief && !status?.total}
				<span class={styles.progress}>No versions yet</span>
			{:else if status?.total}
				<span class={[styles.progress, status.read >= status.total && styles.complete]}>
					<span class={styles.count}>{status.read}/{status.total} <span class="sr-only">sections read</span></span>
					{#if status.read >= status.total}<Completed />{/if}
				</span>
			{/if}
		{/if}
		{#if entry.updatedAt}
			<span class={styles.updated}><span class="sr-only">Updated</span> {format(parseISO(entry.updatedAt), DATE_FORMATS.full)}</span>
		{/if}
</li>
