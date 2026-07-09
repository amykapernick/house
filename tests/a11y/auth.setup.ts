import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test as setup } from '@playwright/test';
import { clerkSetup, clerk } from '@clerk/testing/playwright';

const authFile = path.join(path.dirname(fileURLToPath(import.meta.url)), `.auth/state.json`);

setup(`authenticate with Clerk test user`, async ({ page }) => {
	await clerkSetup({
		publishableKey: process.env.VITE_CLERK_PUBLISHABLE_KEY,
		secretKey: process.env.CLERK_SECRET_KEY,
	});

	const email = process.env.CLERK_TEST_USER_EMAIL;
	const password = process.env.CLERK_TEST_USER_PASSWORD;
	if (!email || !password) {
		throw new Error(
			`CLERK_TEST_USER_EMAIL and CLERK_TEST_USER_PASSWORD must be set to run authenticated accessibility tests.`
		);
	}

	// Clerk must be loaded on the page before clerk.signIn() can use it, so
	// visit any route that mounts the SDK (the root layout does this on every page).
	await page.goto(`/sign-in`);
	await clerk.signIn({
		page,
		signInParams: { strategy: `password`, identifier: email, password },
	});
	await page.goto(`/`);
	await clerk.loaded({ page });

	await page.context().storageState({ path: authFile });
});

export { authFile };
