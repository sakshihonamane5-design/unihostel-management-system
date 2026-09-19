import { test, expect } from '@playwright/test';

test('has title and login form', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/UniHostel/i);
  await expect(page.locator('h1')).toContainText('Sign in to UniHostel');
});
