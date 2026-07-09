import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * Captures manifest.json's "richer install UI" screenshots. The page shows
 * real household data (calendar, tasks, small-human tracker) and this repo
 * is public, so the content is blurred beyond legibility before capture -
 * only layout/branding needs to come through, not the actual data.
 */

const OUT_DIR = path.join(import.meta.dirname, `../../static/screenshots`);
const BLUR_CSS = `main.main { filter: blur(18px); }`;

async function captureBlurred(page: Page, filename: string) {
	await page.goto(`/`);
	await expect(page.locator(`main.main`)).toBeVisible();
	await page.addStyleTag({ content: BLUR_CSS });
	fs.mkdirSync(OUT_DIR, { recursive: true });
	await page.screenshot({ path: path.join(OUT_DIR, filename) });
}

test.describe(`manifest screenshots`, () => {
	test.use({ viewport: { width: 1280, height: 800 } });
	test(`wide (desktop install UI)`, async ({ page }) => {
		await captureBlurred(page, `wide.png`);
	});
});

test.describe(`manifest screenshots`, () => {
	test.use({ viewport: { width: 720, height: 1280 } });
	test(`narrow (mobile install UI)`, async ({ page }) => {
		await captureBlurred(page, `narrow.png`);
	});
});
