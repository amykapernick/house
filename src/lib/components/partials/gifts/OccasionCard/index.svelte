<script lang="ts">
	import type { Component } from 'svelte';
	import { formatCurrency } from '$utils/currency';
	import { describeDaysUntil, formatOccasionDate } from '$utils/gifts';
	import Card from '$parts/Card/index.svelte';
	import Pill from '$parts/Pill/index.svelte';
	import Plus from '$img/icons/f-add-outline.svg?component';
	import Claimed from '$img/icons/circle-outline.svg?component';
	import Bought from '$img/icons/check (2).svg?component';
	// TODO: swap for a gift icon once one's added to src/lib/img/icons.
	import Wrapped from '$img/icons/check-double.svg?component';
	import type { GiftOccasion, GiftPurchase } from '$types/generated';
	import styles from './index.module.css';

	let {
		occasion,
		onEdit,
		onAddPurchase,
		onEditPurchase,
	}: {
		occasion: GiftOccasion;
		onEdit: () => void;
		onAddPurchase: (personId: string) => void;
		onEditPurchase: (purchase: GiftPurchase) => void;
	} = $props();

	// Claimed: empty box, bought: ticked, wrapped: gift.
	const STATUS: Record<string, { Icon: Component; pill: 'warning' | 'info' | 'success'; outline: boolean; label: string }> = {
		claimed: { Icon: Claimed, pill: `warning`, outline: true, label: `Claimed` },
		bought: { Icon: Bought, pill: `info`, outline: false, label: `Bought` },
		wrapped: { Icon: Wrapped, pill: `success`, outline: false, label: `Wrapped` },
	};

	let headingId = $derived(`occasion-${occasion.id}`);
	// A birthday is for one person, named in the occasion itself, so their row heading is only
	// kept for screen readers.
	let hidePersonName = $derived(occasion.type === `birthday` && occasion.people.length === 1);
</script>

<Card class={styles.card}>
	<section aria-labelledby={headingId}>
		<header class={styles.header}>
			<div>
				<h3 id={headingId}>{occasion.name}</h3>
				<p class={styles.when}>
					{formatOccasionDate(occasion)}{#if occasion.type !== `birthday`}&nbsp;· {describeDaysUntil(occasion.daysUntil)}{/if}
				</p>
			</div>
			<button
				type="button"
				class={styles.edit}
				onclick={onEdit}
				aria-label="Edit {occasion.name}">Edit</button
			>
		</header>

		{#if occasion.spent}
			<p class={styles.spent}>{formatCurrency(occasion.spent)} spent</p>
		{/if}

		{#if occasion.people.length}
			<ul class={styles.people}>
				{#each occasion.people as entry (entry.personId)}
					<li class={styles.person}>
						<div class={styles.personHeader}>
							<strong class={hidePersonName ? `sr-only` : ``}>{entry.name}</strong>
							<button
								type="button"
								class={styles.add}
								onclick={() => onAddPurchase(entry.personId)}
								aria-label="Log a purchase for {entry.name}"
								title="Log a purchase for {entry.name}"><Plus aria-hidden="true" /></button
							>
						</div>

						{#if entry.purchases.length}
							<ul class={styles.items}>
								{#each entry.purchases as purchase (purchase.id)}
									{@const status = STATUS[purchase.status] ?? STATUS.claimed}
									<li>
										<Pill
											class={styles.item}
											status={status.pill}
											outline={status.outline}
										>
											<button
												type="button"
												class={styles.itemButton}
												onclick={() => onEditPurchase(purchase)}
												aria-label="{purchase.title}, {status.label.toLowerCase()}. Edit"
												><status.Icon aria-hidden="true" /></button
											>
											<span>{purchase.title}</span>
										</Pill>
									</li>
								{/each}
							</ul>
						{:else}
							<div>
								<Pill
									status="warning"
									outline>Nothing yet</Pill
								>
							</div>
						{/if}
					</li>
				{/each}
			</ul>
		{:else}
			<p class={styles.when}>Nobody added yet - edit the occasion to choose who it's for.</p>
		{/if}
	</section>
</Card>
