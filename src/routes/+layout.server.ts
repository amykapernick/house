import { env } from '$env/dynamic/private';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async () => {
	return {
		clerkPublishableKey: env.CLERK_PUBLISHABLE_KEY ?? '',
	};
};
