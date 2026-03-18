import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const siteConfigPath = path.join(process.cwd(), 'src/siteConfig-test.json');
const SITE = JSON.parse(fs.readFileSync(siteConfigPath, 'utf-8')) as {
  iconLinks: unknown[];
  customLinks: unknown[];
  isBlogDisplayed: boolean;
  contactFormEnabled: boolean;
};

test.describe('Site Config Tests', () => {
  test('displays correct number of icon links', async ({ page }) => {
    await page.goto('/');

    // Only count icon links in the primary icon links container
    const iconLinks = page
      .getByTestId('icon-links-container')
      .getByTestId('icon-link');

    await expect(iconLinks).toHaveCount(SITE.iconLinks.length);
  });

  test('displays correct number of custom links', async ({ page }) => {
    await page.goto('/');

    // Only count top-level custom links, not links rendered for blog posts
    const customLinks = page
      .getByTestId('custom-links-container')
      .getByTestId('custom-link');

    await expect(customLinks).toHaveCount(SITE.customLinks.length);
  });

  test('displays custom link text and descriptions correctly', async ({ page }) => {
    await page.goto('/');

    // Check first link (with description)
    await expect(page.getByText('First Link').first()).toBeVisible();
    await expect(page.getByText('First link description').first()).toBeVisible();

    // Check second link (without description)
    await expect(page.getByText('Second Link').first()).toBeVisible();

    // Check third link (with description)
    await expect(page.getByText('Third Link').first()).toBeVisible();
    await expect(page.getByText('Third link description').first()).toBeVisible();
  });

  test('posts section visibility matches isBlogDisplayed flag', async ({ page }) => {
    await page.goto('/');

    const postsSection = page.getByTestId('posts-section');

    if (SITE.isBlogDisplayed) {
      await expect(postsSection).toBeVisible();
    } else {
      await expect(postsSection).toHaveCount(0);
    }
  });

  test('contact section visibility matches contactFormEnabled flag', async ({ page }) => {
    await page.goto('/');

    const contactSection = page.getByTestId('contact-section');

    if (SITE.contactFormEnabled) {
      await expect(contactSection).toBeVisible();
    } else {
      await expect(contactSection).toHaveCount(0);
    }
  });
});
