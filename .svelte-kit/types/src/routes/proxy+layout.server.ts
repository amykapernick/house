// @ts-nocheck
import { env } from '$env/dynamic/private';
import type { LayoutServerLoad } from './$types';

export const load = async () => {
	return {
		clerkPublishableKey: env.CLERK_PUBLISHABLE_KEY ?? '',
	};
};
;null as any as LayoutServerLoad;