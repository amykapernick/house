import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';
import 'dotenv/config';

/**
 * Separate from playwright.config.ts on purpose: these specs screenshot
 * every route (real, unblurred household data) at three widths for manual
 * visual review, and must never get swept into `npm run test:e2e` / CI. The
 * spec filenames deliberately avoid the "*public.spec.ts" / "*authenticated.spec.ts"
 * suffixes that playwright.config.ts's projects match on, so this only runs
 * when invoked explicitly via `npm run generate:route-screenshots`.
 */

const authFile = path.join(import.meta.dirname, `tests/setup/.auth/state.json`);
// Defaults to the `vite dev` port (5173), not `vite preview`'s 4173 like
// playwright.config.ts - this tool is for ad hoc local review against dev,
// never run in CI, so there's no build/preview step to point it at.
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:5173`;

export default defineConfig({
	testDir: `./tests`,
	fullyParallel: true,
	reporter: `list`,
	use: {
		baseURL,
		trace: `off`,
	},
	// Baseline images for the toHaveScreenshot() calls in
	// route-screenshot-helpers.ts (see #641's migration safety net) - kept
	// out of tests/screenshots/output/ (the raw manual-review dump) and out
	// of git, since these are full-page captures of real household data.
	snapshotPathTemplate: `tests/screenshots/baselines/{arg}{ext}`,
	projects: [
		{
			name: `setup`,
			testMatch: /setup\/auth\.setup\.ts/,
		},
		{
			name: `route-screenshots-pub`,
			testMatch: /route-screenshots-pub\.spec\.ts$/,
			use: { ...devices[`Desktop Chrome`] },
		},
		{
			name: `route-screenshots-auth`,
			testMatch: /route-screenshots-auth\.spec\.ts$/,
			dependencies: [`setup`],
			use: { ...devices[`Desktop Chrome`], storageState: authFile },
		},
	],
});
