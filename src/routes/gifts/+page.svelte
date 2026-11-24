<script lang="ts">
	import { untrack } from 'svelte';
	import { format, parseISO } from 'date-fns';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { DATE_FORMATS } from '$utils/dateFormats';
	import { formatCurrency } from '$utils/currency';
	import { isAuthenticated } from '$lib/auth';
	import { fetchGiftsOverview, fetchGiftPerson, fetchGiftHistory, giftMutation } from '$utils/gifts';
	import { getPageTitle } from '$utils/pageTitle';
	import Title from '$parts/Title/index.svelte';
	import Tabs from '$parts/Tabs/index.svelte';
	import Select from '$parts/Select/index.svelte';
	import Skeleton from '$parts/Skeleton/index.svelte';
	import EmptyState from '$parts/EmptyState/index.svelte';
	import Pill from '$parts/Pill/index.svelte';
	import OccasionCard from '$partials/gifts/OccasionCard/index.svelte';
	import PersonGifts from '$partials/gifts/PersonGifts/index.svelte';
	import Household from '$partials/gifts/Household/index.svelte';
	import OccasionModal from '$partials/gifts/OccasionModal/index.svelte';
	import IdeaModal from '$partials/gifts/IdeaModal/index.svelte';
	import type { IdeaDraft } from '$partials/gifts/IdeaModal/index.svelte';
	import PurchaseModal from '$partials/gifts/PurchaseModal/index.svelte';
	import type { PurchaseDraft } from '$partials/gifts/PurchaseModal/index.svelte';
	import type { Gifts, GiftPerson, GiftOccasion, GiftPurchase, GiftIdea, GiftHistoryEntry, GiftWishlistItem, GiftQuickOccasion } from '$types/generated';
	import styles from './+page.module.css';

	// Everything shown here comes shaped from the API's gifts query (people's lists, occasion
	// totals, what can be claimed or edited, and nothing about gifts for the signed-in person).

	const tabs = [
		{ id: `upcoming`, label: `Upcoming` },
		{ id: `people`, label: `People` },
		{ id: `history`, label: `Past gifts` },
	];

	let overview = $state<Gifts | null>(null);
	// A primitive, so effects keyed on it don't re-run every time the overview is refetched.
	let linked = $derived(overview?.linked ?? false);
	let loading = $state(true);
	let notice = $state(``);
	let activeTab = $state(tabs[0].id);

	$effect(() => {
		const hash = page.url.hash.slice(1);
		if (hash && tabs.some((tab) => tab.id === hash)) activeTab = hash;
	});

	function setActiveTab(id: string) {
		activeTab = id;
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- resolve() is used; the rule can't trace it through the hash concatenation
		goto(`${resolve(`/gifts`)}#${id}`, { replaceState: true, noScroll: true, keepFocus: true });
	}

	function handleOverview(data: Gifts | null) {
		overview = data;
		loading = false;
		const people = data?.people ?? [];
		if (people.length && !people.some((entry) => entry.id === selectedPersonId)) {
			selectedPersonId = people.find((entry) => !entry.isUs)?.id ?? people[0].id;
		}
	}

	function loadOverview(skipCache = false) {
		fetchGiftsOverview({ onStale: skipCache ? undefined : handleOverview, skipCache }).then(handleOverview);
	}

	// Each load runs untracked: the cached result arrives synchronously (onStale) and writes
	// state the load also reads, which would otherwise re-run the effect and refetch in a loop.
	$effect(() => {
		if ($isAuthenticated) untrack(() => loadOverview());
	});

	// People tab: one person at a time, via gifts.person(id).
	let selectedPersonId = $state(``);
	let person = $state<GiftPerson | null>(null);
	let personLoading = $state(false);

	function loadPerson(skipCache = false) {
		const id = selectedPersonId;
		if (!id) return;
		personLoading = !person || person.id !== id;
		const handle = (data: GiftPerson | null) => {
			if (selectedPersonId !== id) return;
			person = data;
			personLoading = false;
		};
		fetchGiftPerson(id, { onStale: skipCache ? undefined : handle, skipCache }).then(handle);
	}

	$effect(() => {
		if (activeTab === `people` && linked && selectedPersonId) untrack(() => loadPerson());
	});

	// Past gifts tab: gifts.history(personId).
	let historyPersonId = $state(``);
	let history = $state<GiftHistoryEntry[]>([]);
	let historyLoading = $state(false);

	function loadHistory(skipCache = false, filter = historyPersonId) {
		const id = filter || null;
		historyLoading = true;
		const handle = (data: GiftHistoryEntry[]) => {
			if ((historyPersonId || null) !== id) return;
			history = data;
			historyLoading = false;
		};
		fetchGiftHistory(id, { onStale: skipCache ? undefined : handle, skipCache }).then(handle);
	}

	$effect(() => {
		// Refetch when the person filter changes.
		const filter = historyPersonId;
		if (activeTab === `history` && linked) untrack(() => loadHistory(false, filter));
	});

	function afterSave(message?: string | null) {
		notice = message ?? ``;
		loadOverview(true);
		if (activeTab === `people`) loadPerson(true);
		if (activeTab === `history`) loadHistory(true);
	}

	let people = $derived(overview?.people ?? []);
	let personOptions = $derived(people.map((entry) => ({ value: entry.id, label: entry.name })));
	const show = (date: string | null | undefined) => (date ? format(parseISO(date), DATE_FORMATS.full) : ``);

	// Occasion modal
	let occasionOpen = $state(false);
	let editingOccasion = $state<GiftOccasion | null>(null);
	let presetPersonIds = $state<string[]>([]);

	function openOccasion(occasion: GiftOccasion | null, preset: string[] = []) {
		editingOccasion = occasion;
		presetPersonIds = preset;
		occasionOpen = true;
	}

	// Idea modal
	let ideaOpen = $state(false);
	let ideaDraft = $state<IdeaDraft>({ personId: `` });

	function openIdea(draft: IdeaDraft) {
		ideaDraft = draft;
		ideaOpen = true;
	}

	async function deleteIdea(idea: GiftIdea) {
		if (!confirm(`Delete the idea "${idea.title}"?`)) return;
		const result = await giftMutation(`deleteGiftIdea`, `$id: ID!`, `id: $id`, { id: idea.id });
		afterSave(result.success ? null : result.message);
	}

	async function suggestIdea(idea: GiftIdea) {
		const name = person?.name ?? `their`;
		if (!confirm(`Add "${idea.title}" to ${name}'s wishlist? They'll see it there, suggested by you.`)) return;
		const result = await giftMutation(`suggestGiftIdea`, `$id: ID!`, `id: $id`, { id: idea.id });
		afterSave(result.success ? `Added to ${name}'s wishlist` : result.message);
	}

	// Purchase modal (also claims wishlist items)
	let purchaseOpen = $state(false);
	let purchaseDraft = $state<PurchaseDraft>({ personId: ``, title: `` });
	let claimItemId = $state<string | null>(null);

	function openPurchase(draft: PurchaseDraft, claimId: string | null = null) {
		purchaseDraft = draft;
		claimItemId = claimId;
		purchaseOpen = true;
	}

	// New purchases default to the person's next occasion, as worked out by the API.
	function defaultsFor(personId: string): Pick<PurchaseDraft, `occasionId`> {
		const next = people.find((entry) => entry.id === personId)?.nextOccasion;
		return { occasionId: next?.id ?? null };
	}

	function claimItem(item: GiftWishlistItem) {
		openPurchase({ personId: item.personId, title: item.title, url: item.url, ...defaultsFor(item.personId) }, item.id);
	}

	function buyIdea(idea: GiftIdea) {
		const occasion = people.find((entry) => entry.id === idea.personId)?.occasions.find((entry) => entry.id === idea.occasionId);
		// Already on their wishlist: claim it there too, so nobody else buys it.
		openPurchase(
			{
				personId: idea.personId,
				title: idea.title,
				url: idea.url,
				notes: idea.notes,
				price: idea.price,
				ideaId: idea.id,
				status: `bought`,
				...(occasion ? { occasionId: occasion.id } : defaultsFor(idea.personId)),
			},
			idea.wishlistItemId ?? null
		);
	}

	function editPurchase(purchase: GiftPurchase) {
		openPurchase({ ...purchase });
	}

	function openHistoryEntry(entry: GiftHistoryEntry) {
		if (entry.purchase) {
			editPurchase(entry.purchase);
			return;
		}
		openPurchase({
			personId: entry.personId,
			title: entry.title,
			url: entry.url,
			wishlistItemId: entry.wishlistItemId,
			wishlistClaimId: entry.wishlistClaimId,
			...defaultsFor(entry.personId),
		});
	}

	// One click from "needs details": log the wishlist claim against an upcoming occasion.
	let quickSaving = $state(``);

	async function quickAdd(entry: GiftHistoryEntry, occasion: GiftQuickOccasion) {
		quickSaving = entry.id;
		const result = await giftMutation(`saveGiftPurchase`, `$input: GiftPurchaseInput!`, `input: $input`, {
			input: {
				personId: entry.personId,
				title: entry.title,
				url: entry.url,
				occasionId: occasion.id,
				status: `claimed`,
				wishlistItemId: entry.wishlistItemId,
				wishlistClaimId: entry.wishlistClaimId,
			},
		});
		quickSaving = ``;
		afterSave(result.success ? `Added ${entry.title} to ${occasion.label}` : result.message);
	}

	async function deletePurchase(purchase: GiftPurchase) {
		if (!confirm(`Delete "${purchase.title}"? Anything claimed on the family wishlist stays claimed.`)) return;
		const result = await giftMutation(`deleteGiftPurchase`, `$id: ID!`, `id: $id`, { id: purchase.id });
		afterSave(result.success ? null : result.message);
	}
</script>

<svelte:head>
	<title>{getPageTitle(`Gifts`)}</title>
	<meta
		name="description"
		content="Plan presents for the family: occasions, ideas, purchases and past gifts"
	/>
</svelte:head>

<Title>Gifts</Title>

{#if loading}
	<Skeleton rows={3} />
{:else if !overview}
	<EmptyState
		title="Couldn't load gifts"
		message="Try again in a moment."
	/>
{:else}
	{#if overview.viewer}
		<p class={styles.viewer}>
			Signed in as <strong>{overview.viewer.name}</strong>
			{#if overview.viewer.wishlistPersonId}
				- {overview.viewer.wishlistPersonName ?? `someone`} on the family wishlist, so gifts for them are hidden from you.
			{:else}
				- not linked to the family wishlist yet.
			{/if}
		</p>
	{/if}

	{#if !overview.linked}
		<section
			class={styles.link}
			aria-labelledby="link-heading"
		>
			<h2 id="link-heading">Who's who on the family wishlist?</h2>
			<p>Linking you to your wishlist person is how gifts for you stay hidden from you. Nothing else shows until you're linked.</p>
			{#if !overview.viewer}
				<p class={styles.warning}>Your house app account isn't linked to a family member yet - set clerk_id on your family record first.</p>
			{/if}
			<Household
				household={overview.household}
				linkOptions={overview.linkOptions}
				wishlistAvailable={overview.wishlistAvailable}
				onLinked={() => afterSave()}
			/>
		</section>
	{:else}

		{#if !overview.wishlistAvailable}
			<p
				class={styles.warning}
				role="status"
			>
				The family wishlist isn't reachable right now, so people, wishlists and claims are missing. Our own occasions, ideas and purchases still work.
			</p>
		{/if}
		{#if notice}
			<p
				class={styles.notice}
				role="status"
			>
				{notice}
			</p>
		{/if}

		<Tabs
			{tabs}
			active={activeTab}
			onSelect={setActiveTab}
		/>

		{#if activeTab === `upcoming`}
			<div
				id="panel-upcoming"
				role="tabpanel"
				aria-labelledby="tab-upcoming"
				tabindex="0"
				class={styles.panel}
			>
				<div class={styles.toolbar}>
					<button
						type="button"
						onclick={() => openOccasion(null)}>Add occasion</button
					>
					<button
						type="button"
						onclick={() => openPurchase({ personId: selectedPersonId, title: ``, status: `bought`, ...defaultsFor(selectedPersonId) })}
						disabled={!people.length}>Log a purchase</button
					>
				</div>

				{#if overview.needsDetails.length}
					<section
						class={styles.needs}
						aria-labelledby="needs-heading"
					>
						<h2 id="needs-heading">Claimed on the wishlist - add the details</h2>
						<ul>
							{#each overview.needsDetails as entry (entry.id)}
								<li>
									<span><strong>{entry.title}</strong> for {entry.personName} <span class={styles.muted}>({entry.giver}, {show(entry.date)})</span></span>
									<span class={styles.quick}>
										{#each entry.quickOccasions as occasion (occasion.id)}
											<button
												type="button"
												onclick={() => quickAdd(entry, occasion)}
												disabled={quickSaving === entry.id}
												aria-label="Add {entry.title} to {occasion.label}">Add to {occasion.label}</button
											>
										{/each}
										<button
											type="button"
											class={entry.quickOccasions.length ? styles.secondary : ``}
											onclick={() => openHistoryEntry(entry)}
											disabled={quickSaving === entry.id}
											aria-label="Add details for {entry.title}">Add details</button
										>
									</span>
								</li>
							{/each}
						</ul>
					</section>
				{/if}

				{#if overview.occasions.length}
					<div class={styles.occasions}>
						{#each overview.occasions as occasion (occasion.id)}
							<OccasionCard
								{occasion}
								onEdit={() => openOccasion(occasion)}
								onAddPurchase={(personId) => openPurchase({ personId, title: ``, status: `bought`, occasionId: occasion.id })}
								onEditPurchase={editPurchase}
							/>
						{/each}
					</div>
				{:else}
					<EmptyState
						title="No occasions yet"
						message="Add birthdays, Christmas and anything else you buy for."
					/>
				{/if}
			</div>
		{/if}

		{#if activeTab === `people`}
			<div
				id="panel-people"
				role="tabpanel"
				aria-labelledby="tab-people"
				tabindex="0"
				class={styles.panel}
			>
				{#if people.length}
					<Select
						id="gifts-person"
						label="Person"
						bind:value={selectedPersonId}
						options={personOptions}
					/>
					{#if personLoading}
						<Skeleton rows={3} />
					{:else if person}
						<PersonGifts
							{person}
							wishlistAvailable={overview.wishlistAvailable}
							onClaim={claimItem}
							onAddIdea={() => openIdea({ personId: selectedPersonId })}
							onEditIdea={(idea) => openIdea({ ...idea })}
							onDeleteIdea={deleteIdea}
							onSuggestIdea={suggestIdea}
							onBuyIdea={buyIdea}
							onOpenHistory={openHistoryEntry}
							onAddOccasion={() => openOccasion(null, [selectedPersonId])}
						/>
					{/if}
				{:else}
					<EmptyState
						title="No one to show"
						message="People come from the family wishlist."
					/>
				{/if}
			</div>
		{/if}

		{#if activeTab === `history`}
			<div
				id="panel-history"
				role="tabpanel"
				aria-labelledby="tab-history"
				tabindex="0"
				class={styles.panel}
			>
				<Select
					id="history-person"
					label="Person"
					bind:value={historyPersonId}
					options={[{ value: ``, label: `Everyone` }, ...personOptions]}
				/>
				{#if historyLoading && !history.length}
					<Skeleton rows={3} />
				{:else if history.length}
					<div class={styles.tableWrap}>
						<table class={styles.table}>
							<thead>
								<tr>
									<th scope="col">Date</th>
									<th scope="col">For</th>
									<th scope="col">Gift</th>
									<th scope="col">From</th>
									<th scope="col">Price</th>
									<th scope="col">Status</th>
									<th scope="col"><span class="sr-only">Actions</span></th>
								</tr>
							</thead>
							<tbody>
								{#each history as entry (entry.id)}
									<tr>
										<td>{show(entry.date)}</td>
										<td>{entry.personName}</td>
										<td>
											<!-- eslint-disable svelte/no-navigation-without-resolve -- external shop link (wishlist item or our idea), not an internal route -->
											{#if entry.url}<a
													href={entry.url}
													target="_blank"
													rel="noopener noreferrer">{entry.title}</a
												>{:else}{entry.title}{/if}
											<!-- eslint-enable svelte/no-navigation-without-resolve -->
											{#if entry.occasionName}<span class={styles.muted}>({entry.occasionName})</span>{/if}
											{#if entry.needsDetails}<Pill
													status="warning"
													outline>Needs details</Pill
												>{/if}
										</td>
										<td>{entry.giver ?? `-`}</td>
										<td>{entry.price ? formatCurrency(entry.price) : `-`}</td>
										<td class={styles.status}>{entry.status}</td>
										<td class={styles.rowActions}>
											{#if entry.canEdit}
												<button
													type="button"
													onclick={() => openHistoryEntry(entry)}
													aria-label="{entry.purchase ? `Edit` : `Add details for`} {entry.title}">{entry.purchase ? `Edit` : `Add details`}</button
												>
											{/if}
											{#if entry.purchase}
												<button
													type="button"
													onclick={() => entry.purchase && deletePurchase(entry.purchase)}
													aria-label="Delete {entry.title}">Delete</button
												>
											{/if}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{:else}
					<EmptyState title="No past gifts yet" />
				{/if}
			</div>
		{/if}

		<OccasionModal
			bind:open={occasionOpen}
			occasion={editingOccasion}
			{presetPersonIds}
			{people}
			onSaved={() => afterSave()}
		/>
		<IdeaModal
			bind:open={ideaOpen}
			draft={ideaDraft}
			{people}
			onSaved={() => afterSave()}
		/>
		<PurchaseModal
			bind:open={purchaseOpen}
			draft={purchaseDraft}
			{people}
			{claimItemId}
			onSaved={afterSave}
		/>
	{/if}
{/if}
