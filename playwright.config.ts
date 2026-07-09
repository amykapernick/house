import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

const authFile = path.join(import.meta.dirname, `tests/a11y/.auth/state.json`);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:4173`;

export default defineConfig({
	testDir: `./tests/a11y`,
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 2 : undefined,
	reporter: process.env.CI ? [[`list`], [`html`, { open: `never` }]] : `list`,
	use: {
		baseURL,
		trace: `on-first-retry`,
	},
	projects: [
		{
			name: `setup`,
			testMatch: /auth\.setup\.ts/,
		},
		{
			name: `public`,
			testMatch: /axe-public\.spec\.ts/,
			use: { ...devices[`Desktop Chrome`] },
		},
		{
			name: `authenticated`,
			testMatch: /axe-authenticated\.spec\.ts/,
			dependencies: [`setup`],
			use: { ...devices[`Desktop Chrome`], storageState: authFile },
		},
	],
});
