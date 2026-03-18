import { test } from '@playwright/test';

test('debug carousel page load', async ({ page }) => {
  // Capture console messages
  page.on('console', msg => console.log('CONSOLE:', msg.type(), msg.text()));

  // Capture page errors
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  // Capture crashes
  page.on('crash', () => console.log('PAGE CRASHED!'));

  try {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 10000 });
    console.log('Page loaded successfully!');

    // Wait a bit to see if there are delayed errors
    await page.waitForTimeout(2000);
  } catch (error) {
    console.log('ERROR loading page:', error);
  }
});
