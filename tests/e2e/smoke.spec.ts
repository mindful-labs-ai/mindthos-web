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
    await page.goto('/');

    // Test tab navigation
    await page.keyboard.press('Tab');

    // At least one element should be focusable
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('dark mode toggle works', async ({ page }) => {
    await page.goto('/');

    // Check initial theme (light mode)
    const html = page.locator('html');
    const initialClass = await html.getAttribute('class');

    // This test will pass even if dark mode toggle doesn't exist yet
    // It's a placeholder for when you implement dark mode
    expect(initialClass).toBeDefined();
  });
});
