<script lang="ts">
	import type { Component } from 'svelte';
	import { formatCurrency } from '$utils/currency';
	import { describeDaysUntil, formatOccasionDate, tagLabel, THEME_TAGS, withoutYear } from '$utils/gifts';
	import Card from '$parts/Card/index.svelte';
	import Pill from '$parts/Pill/index.svelte';
	import Plus from '$img/icons/plus.svg?component';
	import Bought from '$img/icons/check-2.svg?component';
	import Wrapped from '$img/icons/gift.svg?component';
	import type { GiftOccasion, GiftPurchase } from '$types/generated';
	import styles from './index.module.css';

	let {
		occasion,
		onEdit,
		onAddPurchase,
		onEditPurchase,
		hideYear = false,
	}: {
		occasion: GiftOccasion;
		/** "Christmas" rather than "Christmas 2026" - upcoming ones don't need the year. */
		hideYear?: boolean;
		onEdit: () => void;
		onAddPurchase: (personId: string) => void;
		onEditPurchase: (purchase: GiftPurchase) => void;
	} = $props();

	// Shown as a checkbox: claimed is an empty box, bought is ticked, wrapped is just the gift (no box).
	const STATUS: Record<string, { Icon: Component | null; pill: 'warning' | 'info' | 'success'; outline: boolean; label: string }> = {
		claimed: { Icon: null, pill: `warning`, outline: true, label: `Claimed` },
		bought: { Icon: Bought, pill: `info`, outline: false, label: `Bought` },
		wrapped: { Icon: Wrapped, pill: `success`, outline: false, label: `Wrapped` },
	};

	let headingId = $derived(`occasion-${occasion.id}`);
	let title = $derived(hideYear ? withoutYear(occasion.name) : occasion.name);
	// A birthday is for one person, named in the occasion itself, so their row heading is only
	// kept for screen readers.
	let hidePersonName = $derived(occasion.type === `birthday` && occasion.people.length === 1);

	const themeName = (tag: string) => THEME_TAGS.find((entry) => entry.value === tag)?.long ?? tag;
</script>

<Card class={styles.card}>
	<section aria-labelledby={headingId}>
		<header class={styles.header}>
			<div>
				<h3 id={headingId}>{title}</h3>
				<p class={styles.when}>
					{formatOccasionDate(occasion)}{#if occasion.type !== `birthday`}&nbsp;· {describeDaysUntil(occasion.daysUntil)}{/if}
				</p>
			</div>
			<button
				type="button"
				class={styles.edit}
				onclick={onEdit}
				aria-label="Edit {title}">Edit</button
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
								><span class="sr-only">Add a gift for {entry.name}</span><Plus aria-hidden="true" /></button
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
												><span class="sr-only">{purchase.title}, {status.label.toLowerCase()}. Edit</span><span
													class={[styles.box, purchase.status === `wrapped` && styles.unboxed]}
													aria-hidden="true">{#if status.Icon}<status.Icon />{/if}</span
												></button
											>
											<span>{purchase.title}</span>
											{#if purchase.tag}<span class={styles.tag}
													><span class="sr-only">Tagged </span>{tagLabel(purchase.tag)}</span
												>{/if}
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

						{#if entry.themed || entry.santa}
							<ul
								class={styles.themes}
								aria-label="Gift theme for {entry.name}"
							>
								{#if entry.themed}
									{#each entry.themes as theme (theme.tag)}
										<li>
											<Pill
												class={styles.theme}
												status={theme.count ? `success` : undefined}
												outline={!theme.count}
											>
												<span class="sr-only">{themeName(theme.tag)}: {theme.count ? `got ${theme.count}` : `still to get`}</span>
												<span aria-hidden="true"
													>{tagLabel(theme.tag)}{#if theme.count > 1}&nbsp;×{theme.count}{/if}</span
												>
											</Pill>
										</li>
									{/each}
								{/if}
								{#if entry.santa}
									<li>
										<Pill
											class={styles.theme}
											status="info"
										>
											<span class="sr-only">From Santa: {entry.santa}</span>
											<span aria-hidden="true">Santa&nbsp;×{entry.santa}</span>
										</Pill>
									</li>
								{/if}
							</ul>
						{/if}
					</li>
				{/each}
			</ul>
		{:else}
			<p class={styles.when}>Nobody added yet - edit the occasion to choose who it's for.</p>
		{/if}
	</section>
</Card>
