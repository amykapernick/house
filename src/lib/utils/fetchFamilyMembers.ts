import fetchClientData from './fetchClientData';

export const EVERYONE = `everyone`;

export type FamilyMember = { slug: string; name: string };

// Shared by the schedule, tasks, and calendar pages so all three filter
// consistently: EVERYONE always passes, otherwise at least one linked family
// member (task/habit assignee, or ics calendar owner) must match the selection.
export function isVisibleToUser(members: { slug: string }[] | null | undefined, selectedUserSlug: string): boolean {
	if (selectedUserSlug === EVERYONE) return true;
	return (members ?? []).some((member) => member.slug === selectedUserSlug);
}

export default async function fetchFamilyMembers(onStale?: (members: FamilyMember[]) => void): Promise<FamilyMember[]> {
	const res = await fetchClientData({
		cacheKey: `family`,
		onStale: (data) => onStale?.(data.users ?? []),
		gqlQuery: `
			query {
				users {
					slug
					name
				}
			}
		`,
	});

	return res.users ?? [];
}
