import { writable, derived } from 'svelte/store';
import type { Clerk as ClerkType } from '@clerk/clerk-js';

export const clerk = writable<ClerkType | null>(null);
export const clerkLoaded = writable(false);
export const isAuthenticated = derived(clerk, ($clerk) => !!$clerk?.session);
export const user = derived(clerk, ($clerk) => $clerk?.user ?? null);

export async function initClerk(publishableKey: string) {
	const { Clerk } = await import(`@clerk/clerk-js`);
	const { ClerkUI } = await import(`@clerk/ui/entry`);
	const clerkInstance = new Clerk(publishableKey);
	await clerkInstance.load({ ui: { ClerkUI } });

	// @clerk/testing's Playwright helpers (used by tests/setup/auth.setup.ts)
	// hard-require window.Clerk to drive sign-in in E2E/a11y tests - this app
	// otherwise only keeps the instance in the Svelte store below.
	window.Clerk = clerkInstance;

	clerk.set(clerkInstance);
	clerkLoaded.set(true);

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
