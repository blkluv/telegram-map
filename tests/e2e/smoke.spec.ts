import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('homepage loads without errors', async ({ page }) => {
    // Navigate to the homepage
    const response = await page.goto('/');

    // Check that the response is successful
    expect(response?.status()).toBe(200);

    // Check that the page is not blank
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(0);

    // Check for basic expected content
    await expect(page.locator('body')).toBeVisible();
  });

  test('page has no unexpected console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    const ignoredPatterns = [
      // External analytics / test keys may produce 4xx errors in test env
      'the server responded with a status of 400',
    ];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (ignoredPatterns.some((pattern) => text.includes(pattern))) {
          return;
        }
        consoleErrors.push(text);
      }
    });

    await page.goto('/');

    // Give the page time to fully load and execute scripts
    await page.waitForLoadState('networkidle');

    // Check for console errors, ignoring known benign ones
    expect(consoleErrors).toEqual([]);
  });

  test('archive page loads without errors', async ({ page }) => {
    const response = await page.goto('/archive');

    expect(response?.status()).toBe(200);

    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(0);
  });
});
