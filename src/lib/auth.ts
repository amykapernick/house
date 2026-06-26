import { writable, derived } from 'svelte/store';
import type { Clerk as ClerkType } from '@clerk/clerk-js';

export const clerk = writable<ClerkType | null>(null);
export const isAuthenticated = derived(clerk, ($clerk) => !!$clerk?.session);
export const user = derived(clerk, ($clerk) => $clerk?.user ?? null);

export async function initClerk(publishableKey: string) {
	const { Clerk } = await import('@clerk/clerk-js');
	const clerkInstance = new Clerk(publishableKey);
	await clerkInstance.load();

	clerk.set(clerkInstance);

	clerkInstance.addListener(() => {
		clerk.set(clerkInstance);
	});

	return clerkInstance;
}

export async function getToken(): Promise<string | null> {
	let clerkInstance: ClerkType | null = null;
	clerk.subscribe((c) => (clerkInstance = c))();
	if (!clerkInstance) return null;
	return (await clerkInstance.session?.getToken()) ?? null;
}
