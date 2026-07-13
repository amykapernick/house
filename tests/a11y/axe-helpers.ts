import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import type { Result } from 'axe-core';

export function formatViolations(violations: Result[]): string {
	if (violations.length === 0) return `no violations`;
	return violations
		.map((v) => `${v.id} (${v.help}): ${v.nodes.map((n) => n.target.join(` `)).join(`, `)}`)
		.join(`\n`);
}

export async function runAxeScan(page: Page, name: string, disableRules: string[] = []): Promise<void> {
	await expect(page.locator(`body`)).toBeVisible();

	// Pages fetch their data client-side after mount (see the Page Data
	// Pattern in CLAUDE.md) and show "Loading..." until it resolves - without
	// this, axe can race ahead and scan the placeholder instead of the real
	// content, silently missing violations that only exist once data renders.
	// Resolves immediately if the page never shows a loading state at all.
	await page.getByText(`Loading...`, { exact: true }).waitFor({ state: `hidden` });

	const results = await new AxeBuilder({ page })
		.withTags([`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`])
		.disableRules(disableRules)
		.analyze();

	await test.info().attach(`axe-results-${name}`, {
		body: JSON.stringify(results, null, 2),
		contentType: `application/json`,
	});

	expect(results.violations, formatViolations(results.violations)).toEqual([]);
}
