import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/');

    // Should redirect to /home
    await expect(page).toHaveURL(/\/home/);

    // Should have a title
    await expect(page).toHaveTitle(/Scribe/);
  });

  test('should have accessible skip link', async ({ page }) => {
    await page.goto('/home');

    // Tab to focus the skip link
    await page.keyboard.press('Tab');

    // Skip link should be visible when focused
    const skipLink = page.getByText('Skip to main content');
    await expect(skipLink).toBeVisible();
  });

  test('should have working navigation', async ({ page }) => {
    await page.goto('/home');

    // Check for navigation elements
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
  });
});
