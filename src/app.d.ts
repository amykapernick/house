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
