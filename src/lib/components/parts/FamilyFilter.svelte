<script lang="ts">
	import { isAuthenticated } from '$lib/auth';
	import fetchFamilyMembers, { EVERYONE, fetchCurrentUserSlug } from '$utils/fetchFamilyMembers';
	import type { FamilyMember } from '$utils/fetchFamilyMembers';
	import { getSavedFamilyFilter, saveFamilyFilter } from '$utils/familyFilterPreference';

	let { pageKey, selectedUserSlug = $bindable(EVERYONE), class: className = '' }: { pageKey: string; selectedUserSlug?: string; class?: string } = $props();

	let familyMembers = $state<FamilyMember[]>([]);

	// A saved per-page selection always wins over the "default to me" lookup.
	// Applying it synchronously (not in an effect) means applyDefault below sees
	// defaultApplied already true no matter which async call resolves first.
	function getSaved() {
		return getSavedFamilyFilter(pageKey);
	}

	const saved = getSaved();
	let defaultApplied = !!saved;
	if (saved) selectedUserSlug = saved;

	// Only overwrite the still-untouched EVERYONE default - if the me lookup
	// resolves after the user has already picked someone (or a saved choice was
	// restored above), leave it alone.
	function applyDefault(slug: string | undefined) {
		if (defaultApplied || !slug || selectedUserSlug !== EVERYONE) return;
		selectedUserSlug = slug;
		defaultApplied = true;
	}

	$effect(() => {
		if (!$isAuthenticated) return;

		function handleFamily(members: FamilyMember[]) { familyMembers = members; }
		fetchFamilyMembers(handleFamily).then(handleFamily);

		fetchCurrentUserSlug(applyDefault).then(applyDefault);
	});

	// Persist every change, including the resolved "default to me" value, so
	// the next visit to this page restores it instead of resetting to Everyone.
	$effect(() => {
		saveFamilyFilter(pageKey, selectedUserSlug);
	});
</script>

{#if familyMembers.length}
	<fieldset class="user_filter {className}">
		<legend>Filter by family member</legend>
		<label>
			<input type="radio" name="family-filter" value={EVERYONE} bind:group={selectedUserSlug} />
			Everyone
		</label>
		{#each familyMembers as member (member.slug)}
			<label>
				<input type="radio" name="family-filter" value={member.slug} bind:group={selectedUserSlug} />
				{member.name}
			</label>
		{/each}
	</fieldset>
{/if}

<style>
	.user_filter {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 1em;
		border: none;
		padding: 0;
		margin-bottom: 1em;

		legend {
			font-weight: bold;
			padding: 0;
		}

		label {
			display: flex;
			align-items: center;
			gap: 0.3em;
		}
	}
</style>
