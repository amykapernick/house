/// <reference types="@poppanator/sveltekit-svg" />

declare module 'postcss-advanced-variables';
declare module 'postcss-hexrgba';

declare global {
	namespace App {
		interface Locals {
			auth: {
				userId: string | null
				sessionId: string | null
				token: string | null
			}
		}
	}
}

export {};
