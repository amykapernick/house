import fs from 'node:fs';
import path from 'node:path';
import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

export const OUT_DIR = path.join(import.meta.dirname, `output`);
export const WIDTHS = [400, 1000, 2000];

export async function captureRouteAtAllWidths(page: Page, name: string): Promise<void> {
	await expect(page.locator(`body`)).toBeVisible();
	await waitForContentReady(page);

	fs.mkdirSync(OUT_DIR, { recursive: true });

	for (const width of WIDTHS) {
		await page.setViewportSize({ width, height: 1000 });
		await page.screenshot({ path: path.join(OUT_DIR, `${name}-${width}w.png`), fullPage: true });
		// Migration safety net for #641 (CSS Modules migration) - diffs each
		// capture against a locally-stored baseline so a style-only refactor
		// gets caught automatically instead of relying purely on manual review.
		await expect(page).toHaveScreenshot(`${name}-${width}w.png`, { fullPage: true });
	}
}

export async function waitForSignedIn(page: Page): Promise<void> {
	// Clerk resolves the existing session asynchronously after mount -
	// isAuthenticated ($lib/auth.ts) starts false and flips true once
	// $clerk.session populates, so Header renders its signed-out state (a
	// "Sign in" button) for a brief window on every navigation. Screenshotting
	// during that window - easy to hit on the authenticated spec, since it's
	// the only project that ever expects the signed-in Header - caught a
	// stale "Sign in" button and skeleton-loading content instead of the
	// real page (see #641's migration safety net).
	await expect(page.getByRole(`button`, { name: `Sign in` })).toHaveCount(0, { timeout: 10000 });
}

async function waitForContentReady(page: Page): Promise<void> {
	// Pages fetch their data client-side after mount and show "Loading..."
	// until it resolves (see the Page Data Pattern in CLAUDE.md). The $effect
	// that kicks off the fetch can take a tick to fire after navigation
	// settles, so checking straight for "hidden" (as tests/a11y/axe-helpers.ts
	// does) is racy here: it can pass before the loading state ever appears,
	// letting the screenshot capture the placeholder instead of real content.
	// Give it a grace window to show up first (some pages have more than one
	// loading section, e.g. the dashboard's widgets - .count() rather than a
	// single .waitFor() avoids strict-mode issues with multiple matches), then
	// wait for every one of them to clear. Pages with cached/instant data that
	// never show a loading state at all just pass the first wait immediately.
	const loading = page.getByText(`Loading...`, { exact: true });
	await loading
		.first()
		.waitFor({ state: `visible`, timeout: 2000 })
		.catch(() => {});
	await expect.poll(() => loading.count(), { timeout: 20000 }).toBe(0);
}
