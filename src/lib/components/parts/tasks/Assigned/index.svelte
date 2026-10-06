<script lang="ts">
	import { isAuthenticated } from '$lib/auth';
	import fetchFamilyMembers from '$utils/fetchFamilyMembers';
	import Logo from '$img/monogram_colour.svg?component';
	import type { User } from '$types/global';
	import styles from './index.module.css';

	let { assignees = [], class: className = '' }: { assignees: User[]; class?: string } = $props();

	let familyCount = $state(0);

	$effect(() => {
		if ($isAuthenticated) {
			function handleFamily(members: { slug: string }[]) {
				familyCount = members.length;
			}
			fetchFamilyMembers(handleFamily).then(handleFamily);
		}
	});

	// resolveAssignedUsers (household_api) resolves an unassigned/unmatched task
	// to the whole family, so "everyone" shows up here as an assignees array the
	// same length as the family itself rather than a dedicated flag.
	let everyone = $derived(familyCount > 0 && assignees.length >= familyCount);
	let overlap = $derived(!everyone && assignees.length > 1);
</script>

{#if everyone}
	<span class="{styles.everyone} {className}">
		<span class="sr-only">Everyone</span>
		<Logo class={styles.logo} />
	</span>
{:else}
	<ul class="{styles.list} {className}" data-overlap={overlap}>
		{#each assignees as { slug, name, profile } (slug)}
			<li class={styles.item}>
				<span class="sr-only">{name}</span>
				{#if profile}
					<img class={styles.image} src={profile} alt="" />
				{:else}
					<span class={styles.image}>
						{name
							.split(' ')
							.map((word) => word[0])
							.join('')}
					</span>
				{/if}
			</li>
		{/each}
	</ul>
{/if}
