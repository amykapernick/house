<script lang="ts">
	import { EVERYONE } from '$utils/fetchFamilyMembers';
	import type { FamilyMember } from '$utils/fetchFamilyMembers';

	let {
		familyMembers,
		selectedUserSlug = $bindable(),
	}: {
		familyMembers: FamilyMember[];
		selectedUserSlug: string;
	} = $props();
</script>

{#if familyMembers.length}
	<fieldset class="user_filter">
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
