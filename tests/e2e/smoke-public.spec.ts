import { test, expect } from '@playwright/test';

test(`sign-in renders the Clerk sign-in form`, async ({ page }) => {
	await page.goto(`/sign-in`);
	await expect(page.getByRole(`textbox`).first()).toBeVisible();
});

test(`recipes renders and can be searched without mutating anything`, async ({ page }) => {
	await page.goto(`/recipes`);
	await expect(page.getByRole(`heading`, { level: 1, name: `Recipes` })).toBeVisible();

	await page.getByPlaceholder(`Search recipes...`).fill(`soup`);
	await expect(page.getByPlaceholder(`Search recipes...`)).toHaveValue(`soup`);
});
