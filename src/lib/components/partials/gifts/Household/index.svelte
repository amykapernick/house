<script lang="ts">
	import Select from '$parts/Select/index.svelte';
	import Pill from '$parts/Pill/index.svelte';
	import { giftMutation } from '$utils/gifts';
	import type { GiftHouseholdMember, GiftLinkOption } from '$types/generated';
	import styles from './index.module.css';

	// Who in the house app is who on the family wishlist. That link is what hides gifts for
	// you from you, so a member can only be linked once here - changing it is a PocketBase edit.
	let {
		household,
		linkOptions,
		wishlistAvailable,
		onLinked,
	}: {
		household: GiftHouseholdMember[];
		linkOptions: GiftLinkOption[];
		wishlistAvailable: boolean;
		onLinked: () => void;
	} = $props();

	// Picked wishlist person per member, by slug.
	let choices = $state<Record<string, string>>({});

	$effect(() => {
		for (const member of household) {
			if (!(member.slug in choices)) choices[member.slug] = ``;
		}
	});
	let saving = $state(``);
	let error = $state(``);

	let options = $derived([{ value: ``, label: `Choose…` }, ...linkOptions.map((option) => ({ value: option.id, label: option.name }))]);

	async function link(member: GiftHouseholdMember) {
		const personId = choices[member.slug];
		if (!personId) return;
		const who = member.isViewer ? `you are` : `${member.name} is`;
		const name = linkOptions.find((option) => option.id === personId)?.name;
		if (!confirm(`Save that ${who} ${name} on the family wishlist? This can't be changed here afterwards.`)) return;

		saving = member.slug;
		error = ``;
		const result = await giftMutation(`linkGiftsPerson`, `$personId: ID!, $memberSlug: String`, `personId: $personId, memberSlug: $memberSlug`, {
			personId,
			memberSlug: member.isViewer ? null : member.slug,
		});
		saving = ``;

		if (!result.success) {
			error = result.message ?? `Couldn't save. Try again.`;
			return;
		}
		onLinked();
	}
</script>

<table class={styles.table}>
	<caption class="sr-only">House app users and their family wishlist person</caption>
	<thead>
		<tr>
			<th scope="col">House app</th>
			<th scope="col">On the family wishlist</th>
		</tr>
	</thead>
	<tbody>
		{#each household as member (member.slug)}
			<tr>
				<th scope="row">
					{member.name}
					{#if member.isViewer}<Pill status="info">You</Pill>{/if}
					{#if !member.hasLogin}<span class={styles.muted}>(no login)</span>{/if}
				</th>
				<td>
					{#if member.wishlistPersonId}
						{member.wishlistPersonName ?? `Someone no longer on the wishlist`}
					{:else if !wishlistAvailable}
						<span class={styles.muted}>Not linked (wishlist unreachable)</span>
					{:else if !linkOptions.length}
						<span class={styles.muted}>Not linked - everyone on the wishlist is taken</span>
					{:else}
						<div class={styles.link}>
							<Select
								id="link-{member.slug}"
								label="Wishlist person for {member.name}"
								hiddenLabel
								bind:value={choices[member.slug]}
								{options}
							/>
							<button
								type="button"
								onclick={() => link(member)}
								disabled={!choices[member.slug] || saving === member.slug}
								aria-label="Link {member.name}">{saving === member.slug ? `Saving…` : `Link`}</button
							>
						</div>
					{/if}
				</td>
			</tr>
		{/each}
	</tbody>
</table>

{#if error}<p
		class={styles.error}
		role="alert"
	>
		{error}
	</p>{/if}
