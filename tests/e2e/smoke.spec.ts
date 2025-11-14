import { expect, test } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('home page loads successfully', async ({ page }) => {
    await page.goto('/');

    // Check that page has a title
    await expect(page).toHaveTitle(/.+/);

    // Check that the page is visible
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('page is keyboard accessible', async ({ page }) => {
    await page.goto('/demo');

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Test tab navigation
    await page.keyboard.press('Tab');

    // At least one element should be focusable
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible({ timeout: 10000 });
  });

  test('dark mode toggle works', async ({ page }) => {
    await page.goto('/demo');
    await page.waitForLoadState('networkidle');

    const html = page.locator('html');

    // Find dark mode toggle button
    const darkModeButton = page.getByRole('button', { name: /dark|light/i });
    await expect(darkModeButton).toBeVisible();

    // Get initial theme state
    const initialClass = await html.getAttribute('class');
    const initiallyDark = initialClass?.includes('dark') ?? false;

    // Click toggle button
    await darkModeButton.click();

    // Wait a bit for the theme to change
    await page.waitForTimeout(100);

    // Verify theme changed
    const newClass = await html.getAttribute('class');
    const nowDark = newClass?.includes('dark') ?? false;

    // Theme should have toggled
    expect(nowDark).toBe(!initiallyDark);

    // Click again to toggle back
    await darkModeButton.click();
    await page.waitForTimeout(100);

    // Verify theme toggled back
    const finalClass = await html.getAttribute('class');
    const finallyDark = finalClass?.includes('dark') ?? false;
    expect(finallyDark).toBe(initiallyDark);
  });
});
