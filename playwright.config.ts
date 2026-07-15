import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

const authFile = path.join(import.meta.dirname, `tests/setup/.auth/state.json`);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:5173`;

export default defineConfig({
	testDir: `./tests`,
	timeout: 60_000,
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 2 : undefined,
	reporter: process.env.CI ? [[`list`], [`html`, { open: `never` }]] : `list`,
	use: {
		baseURL,
		trace: `on-first-retry`,
	},
	// a11y/ and e2e/ specs are told apart by filename suffix, not folder, so
	// either directory can hold public or authenticated specs.
	projects: [
		{
			name: `setup`,
			testMatch: /setup\/auth\.setup\.ts/,
		},
		{
			name: `public`,
			testMatch: /.*public\.spec\.ts/,
			use: { ...devices[`Desktop Chrome`] },
		},
		{
			name: `authenticated`,
			testMatch: /.*authenticated\.spec\.ts/,
			dependencies: [`setup`],
			use: { ...devices[`Desktop Chrome`], storageState: authFile },
		},
	],
});
