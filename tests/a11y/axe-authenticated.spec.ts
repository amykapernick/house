import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { routes } from './routes';
import { formatViolations } from './axe-helpers';

for (const route of routes.filter((r) => r.auth)) {
	test(`${route.name} (${route.path}) has no automatically detectable accessibility violations`, async ({
		page,
	}) => {
		await page.goto(route.path);
		await expect(page.locator(`body`)).toBeVisible();

		const results = await new AxeBuilder({ page })
			.withTags([`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`])
			.analyze();

		await test.info().attach(`axe-results-${route.name}`, {
			body: JSON.stringify(results, null, 2),
			contentType: `application/json`,
		});

		expect(results.violations, formatViolations(results.violations)).toEqual([]);
	});
}
