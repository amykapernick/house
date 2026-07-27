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

		function handleFamily(members: FamilyMember[]) {
			familyMembers = members;
		}
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
	<fieldset class={className}>
		<div class="filter">
			<legend>Filter by family member</legend>
			<input
				type="radio"
				id="family-filter-{pageKey}-everyone"
				name="family-filter"
				value={EVERYONE}
				bind:group={selectedUserSlug}
			/>
			<label for="family-filter-{pageKey}-everyone">Everyone</label>
			{#each familyMembers as member (member.slug)}
				<input
					type="radio"
					id="family-filter-{pageKey}-{member.slug}"
					name="family-filter"
					value={member.slug}
					bind:group={selectedUserSlug}
				/>
				<label
					for="family-filter-{pageKey}-{member.slug}"
					style={member.colour ? `--personColour: var(--${member.colour})` : ''}>{member.name}</label
				>
			{/each}
		</div>
	</fieldset>
{/if}

<style>
	@import '@mixins';

	.filter {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		margin-bottom: 1em;
		padding: 0;
		border: none;
		gap: 0.5em;

		& legend {
			width: 100%;
			padding: 0;
			font-weight: bold;
		}
	}

	input[type='radio'] {
		@include sr_only;

		&:checked {
			& + label {
				border-color: light-dark(var(--purple_solid_flat), color-mix(in oklch, var(--dark_purple_bright) 89%, var(--white)));
				background: light-dark(linear-gradient(color-mix(in oklch, var(--background) 60%, var(--white)) 0%, color-mix(in oklch, var(--background) 70%, var(--brown)) 100%), linear-gradient(color-mix(in oklch, var(--dark_background) 60%, var(--white)) 0%, color-mix(in oklch, var(--dark_background) 40%, var(--white)) 100%));
			}
		}
	}

	label {
		display: flex;
		align-items: center;
		padding: 0.6em 1.2em;
		border: 1px solid var(--border);
		border-radius: 2em;
		color: light-dark(var(--black), color-mix(in oklch, var(--white) 92%, var(--black)));
		gap: 1ch;
		cursor: pointer;

		&::before {
			content: '';
			width: 1em;
			height: 1em;
			border-radius: 100%;
			background: var(--personColour, var(--kapers-crewe));
		}
	}
</style>
