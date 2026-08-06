/// <reference types="@poppanator/sveltekit-svg" />

declare global {
	// Build-time constant injected via `define` in vite.config.ts/vitest.config.ts
	const __SITE_TITLE__: string;

	namespace App {
		interface Locals {
			auth: {
				userId: string | null
				sessionId: string | null
				token: string | null
			}
		}
		interface PageData {
			/** Read by the root +layout.svelte to size $layouts/Default/index.svelte - see its `wide`/`full` props. */
			layoutWidth?: `wide` | `full`
		}
	}
}

export {};
