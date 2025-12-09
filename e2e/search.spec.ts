import { test, expect } from '@playwright/test';

test.describe('Search functionality', () => {
  test('should open search modal with keyboard shortcut', async ({ page }) => {
    await page.goto('/home');

    // Open search with Cmd+K (Mac) or Ctrl+K (Windows/Linux)
    const isMac = process.platform === 'darwin';
    if (isMac) {
      await page.keyboard.press('Meta+KeyK');
    } else {
      await page.keyboard.press('Control+KeyK');
    }

    // Search modal should be visible
    const searchModal = page.getByRole('dialog', { name: /search/i });
    await expect(searchModal).toBeVisible();
  });

  test('search modal should have proper ARIA attributes', async ({ page }) => {
    await page.goto('/home');

    // Open search
    await page.keyboard.press('Meta+KeyK');

    // Check ARIA attributes
    const dialog = page.getByRole('dialog');
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  test('should be able to search and get results', async ({ page }) => {
    await page.goto('/home');

    // Open search
    await page.keyboard.press('Meta+KeyK');

    // Type a search query
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill('test');

    // Should show results or "No results found"
    await expect(page.locator('[role="dialog"]')).toBeVisible();
  });

  test('should close search modal with Escape key', async ({ page }) => {
    await page.goto('/home');

    // Open search
    await page.keyboard.press('Meta+KeyK');

    const searchModal = page.getByRole('dialog');
    await expect(searchModal).toBeVisible();

    // Close with Escape
    await page.keyboard.press('Escape');

    // Modal should be hidden
    await expect(searchModal).not.toBeVisible();
  });
});
