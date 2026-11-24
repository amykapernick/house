<script lang="ts">
	import { format, parseISO } from 'date-fns';
	import { DATE_FORMATS } from '$utils/dateFormats';
	import { formatCurrency } from '$utils/currency';
	import { formatOccasionDate } from '$utils/gifts';
	import Pill from '$parts/Pill/index.svelte';
	import EmptyState from '$parts/EmptyState/index.svelte';
	import type { GiftPerson, GiftWishlistItem, GiftIdea, GiftHistoryEntry } from '$types/generated';
	import styles from './index.module.css';

	// Renders one person exactly as the API returns them (gifts.person(id)): their lists are
	// already filtered, and canClaim/canSuggest/canEdit say what each row allows.
	let {
		person,
		wishlistAvailable,
		onClaim,
		onAddIdea,
		onEditIdea,
		onDeleteIdea,
		onSuggestIdea,
		onBuyIdea,
		onOpenHistory,
		onAddOccasion,
	}: {
		person: GiftPerson;
		wishlistAvailable: boolean;
		onClaim: (item: GiftWishlistItem) => void;
		onAddIdea: () => void;
		onEditIdea: (idea: GiftIdea) => void;
		onDeleteIdea: (idea: GiftIdea) => void;
		onSuggestIdea: (idea: GiftIdea) => void;
		onBuyIdea: (idea: GiftIdea) => void;
		onOpenHistory: (entry: GiftHistoryEntry) => void;
		onAddOccasion: () => void;
	} = $props();

	const show = (date: string | null | undefined) => (date ? format(parseISO(date), DATE_FORMATS.full) : ``);
</script>

<div class={styles.person}>
	<section aria-labelledby="person-occasions">
		<div class={styles.sectionHeader}>
			<h3 id="person-occasions">Occasions</h3>
			<button
				type="button"
				onclick={onAddOccasion}>Add occasion</button
			>
		</div>
		{#if person.occasions.length}
			<ul class={styles.list}>
				{#each person.occasions as occasion (occasion.id)}
					<li>{occasion.name} - {formatOccasionDate(occasion)}</li>
				{/each}
			</ul>
		{:else}
			<p class={styles.muted}>No occasions yet - add their birthday so it shows up in Upcoming.</p>
		{/if}
	</section>

	<section aria-labelledby="person-wishlist">
		<h3 id="person-wishlist">On their wishlist</h3>
		{#if !wishlistAvailable}
			<p class={styles.muted}>The family wishlist isn't reachable right now.</p>
		{:else if !person.wishlist.length}
			<p class={styles.muted}>Nothing on their list.</p>
		{:else}
			<ul class={styles.list}>
				{#each person.wishlist as item (item.id)}
					<li class={[styles.item, item.claimed && styles.claimed]}>
						<div>
							<!-- eslint-disable svelte/no-navigation-without-resolve -- external shop link (wishlist item or our idea), not an internal route -->
							{#if item.url}<a
									href={item.url}
									target="_blank"
									rel="noopener noreferrer">{item.title}</a
								>{:else}{item.title}{/if}
							<!-- eslint-enable svelte/no-navigation-without-resolve -->
							{#if item.evergreen}<Pill status="info">Always wanted</Pill>{/if}
							{#if item.evergreen && item.claimedByUs}<Pill status="success">We gave one {show(item.claimedAt)}</Pill>{/if}
							{#if item.claimed}<Pill status={item.claimedByUs ? `success` : `warning`}>Claimed by {item.claimedBy}</Pill>{/if}
							{#if item.suggestedBy}<span class={styles.muted}>Suggested by {item.suggestedBy}</span>{/if}
							{#if item.notes}<p class={styles.muted}>{item.notes}</p>{/if}
						</div>
						{#if item.canClaim}
							<button
								type="button"
								onclick={() => onClaim(item)}
								aria-label="Claim {item.title}">Claim</button
							>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<section aria-labelledby="person-ideas">
		<div class={styles.sectionHeader}>
			<h3 id="person-ideas">Our ideas</h3>
			<button
				type="button"
				onclick={onAddIdea}>Add idea</button
			>
		</div>
		{#if person.ideas.length}
			<ul class={styles.list}>
				{#each person.ideas as idea (idea.id)}
					<li class={styles.item}>
						<div>
							<!-- eslint-disable svelte/no-navigation-without-resolve -- external shop link (wishlist item or our idea), not an internal route -->
							{#if idea.url}<a
									href={idea.url}
									target="_blank"
									rel="noopener noreferrer">{idea.title}</a
								>{:else}{idea.title}{/if}
							<!-- eslint-enable svelte/no-navigation-without-resolve -->
							{#if idea.price}<span class={styles.muted}>~{formatCurrency(idea.price)}</span>{/if}
							{#if idea.status === `suggested`}<Pill status="info">On their wishlist</Pill>{/if}
							{#if idea.notes}<p class={styles.muted}>{idea.notes}</p>{/if}
						</div>
						<div class={styles.actions}>
							<button
								type="button"
								onclick={() => onBuyIdea(idea)}
								aria-label="Bought {idea.title}">Bought it</button
							>
							{#if idea.canSuggest}
								<button
									type="button"
									onclick={() => onSuggestIdea(idea)}
									aria-label="Add {idea.title} to their wishlist">Add to their list</button
								>
							{/if}
							<button
								type="button"
								onclick={() => onEditIdea(idea)}
								aria-label="Edit {idea.title}">Edit</button
							>
							<button
								type="button"
								onclick={() => onDeleteIdea(idea)}
								aria-label="Delete {idea.title}">Delete</button
							>
						</div>
					</li>
				{/each}
			</ul>
		{:else}
			<p class={styles.muted}>No ideas yet.</p>
		{/if}
	</section>

	{#if person.sizes.length}
		<section aria-labelledby="person-sizes">
			<h3 id="person-sizes">Sizes</h3>
			<dl class={styles.sizes}>
				{#each person.sizes as size (size.item)}
					<dt>{size.item}</dt>
					<dd>{size.size} <span class={styles.muted}>(updated {show(size.updatedAt)})</span></dd>
				{/each}
			</dl>
		</section>
	{/if}

	<section aria-labelledby="person-history">
		<h3 id="person-history">Past gifts</h3>
		{#if person.history.length}
			<ul class={styles.list}>
				{#each person.history as entry (entry.id)}
					<li class={styles.item}>
						<div>
							{entry.title}
							<span class={styles.muted}>
								{show(entry.date)}{#if entry.giver}&nbsp;· from {entry.giver}{/if}{#if entry.price}&nbsp;· {formatCurrency(entry.price)}{/if}
							</span>
							{#if entry.needsDetails}<Pill
									status="warning"
									outline>Needs details</Pill
								>{/if}
						</div>
						{#if entry.canEdit}
							<button
								type="button"
								onclick={() => onOpenHistory(entry)}
								aria-label="{entry.purchase ? `Edit` : `Add details for`} {entry.title}">{entry.purchase ? `Edit` : `Add details`}</button
							>
						{/if}
					</li>
				{/each}
			</ul>
		{:else}
			<EmptyState title="No past gifts yet" />
		{/if}
	</section>
</div>
