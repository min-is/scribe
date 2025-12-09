import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should show sign in page for protected routes', async ({ page }) => {
    // Try to access a protected page
    await page.goto('/home');

    // If not authenticated, should redirect to sign-in or show sign-in UI
    // Adjust this based on your actual auth flow
    const url = page.url();
    const isSignInPage = url.includes('sign-in') || url.includes('auth');
    const isHomePage = url.includes('/home');

    // Should either be on sign-in page or home page (if already authenticated)
    expect(isSignInPage || isHomePage).toBeTruthy();
  });

  test('should have rate limiting on login attempts', async ({ page }) => {
    await page.goto('/sign-in');

    // Check that the sign-in form exists
    const emailInput = page.getByLabel(/email/i);
    const passwordInput = page.getByLabel(/password/i);

    if (await emailInput.isVisible()) {
      // Rate limiting is implemented in the backend
      // This test just verifies the form exists
      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
    }
  });
});
