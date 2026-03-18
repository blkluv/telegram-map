import { test, expect } from '@playwright/test';

test.describe('Blog Archive Tests', () => {
  test('displays all test posts on archive page', async ({ page }) => {
    await page.goto('/archive');

    // Check that all 5 test posts are visible
    await expect(page.getByText('Alpha Post')).toBeVisible();
    await expect(page.getByText('Beta Post')).toBeVisible();
    await expect(page.getByText('Gamma Post')).toBeVisible();
    await expect(page.getByText('Delta Post')).toBeVisible();
    await expect(page.getByText('Epsilon Post')).toBeVisible();
  });

  test('search filters posts by title', async ({ page }) => {
    await page.goto('/archive');

    const searchInput = page.getByTestId('archive-search');
    await searchInput.fill('Alpha');

    // Only Alpha Post should be visible
    await expect(page.getByText('Alpha Post')).toBeVisible();
    await expect(page.getByText('Beta Post')).not.toBeVisible();
    await expect(page.getByText('Gamma Post')).not.toBeVisible();
  });

  test('search filters posts by tag', async ({ page }) => {
    await page.goto('/archive');

    const searchInput = page.getByTestId('archive-search');
    await searchInput.fill('tag3');

    // Posts with tag3 should be visible: Beta, Delta, Epsilon
    await expect(page.getByText('Alpha Post')).not.toBeVisible();
    await expect(page.getByText('Beta Post')).toBeVisible();
    await expect(page.getByText('Gamma Post')).not.toBeVisible();
    await expect(page.getByText('Delta Post')).toBeVisible();
    await expect(page.getByText('Epsilon Post')).toBeVisible();
  });

  test('search filters posts by description', async ({ page }) => {
    await page.goto('/archive');

    const searchInput = page.getByTestId('archive-search');
    await searchInput.fill('Second test');

    // Only Beta Post should be visible
    await expect(page.getByText('Alpha Post')).not.toBeVisible();
    await expect(page.getByText('Beta Post')).toBeVisible();
    await expect(page.getByText('Gamma Post')).not.toBeVisible();
  });

  test('sort by title ascending', async ({ page }) => {
    await page.goto('/archive');

    const sortSelect = page.getByTestId('archive-sort');
    await sortSelect.selectOption('title-asc');

    // Get all post titles in order
    const postTitles = await page.locator('[data-title]').evaluateAll(
      (elements) => elements.map((el) => el.getAttribute('data-title'))
    );

    // Should be in alphabetical order: Alpha, Beta, Delta, Epsilon, Gamma
    expect(postTitles).toEqual([
      'Alpha Post',
      'Beta Post',
      'Delta Post',
      'Epsilon Post',
      'Gamma Post',
    ]);
  });

  test('sort by title descending', async ({ page }) => {
    await page.goto('/archive');

    const sortSelect = page.getByTestId('archive-sort');
    await sortSelect.selectOption('title-desc');

    const postTitles = await page.locator('[data-title]').evaluateAll(
      (elements) => elements.map((el) => el.getAttribute('data-title'))
    );

    // Should be in reverse alphabetical order
    expect(postTitles).toEqual([
      'Gamma Post',
      'Epsilon Post',
      'Delta Post',
      'Beta Post',
      'Alpha Post',
    ]);
  });

  test('sort by date newest first', async ({ page }) => {
    await page.goto('/archive');

    const sortSelect = page.getByTestId('archive-sort');
    await sortSelect.selectOption('date-newest');

    const postTitles = await page.locator('[data-title]').evaluateAll(
      (elements) => elements.map((el) => el.getAttribute('data-title'))
    );

    // Should be newest to oldest: Epsilon (May), Delta (Apr), Gamma (Mar), Beta (Feb), Alpha (Jan)
    expect(postTitles).toEqual([
      'Epsilon Post',
      'Delta Post',
      'Gamma Post',
      'Beta Post',
      'Alpha Post',
    ]);
  });

  test('sort by date oldest first', async ({ page }) => {
    await page.goto('/archive');

    const sortSelect = page.getByTestId('archive-sort');
    await sortSelect.selectOption('date-oldest');

    const postTitles = await page.locator('[data-title]').evaluateAll(
      (elements) => elements.map((el) => el.getAttribute('data-title'))
    );

    // Should be oldest to newest: Alpha (Jan), Beta (Feb), Gamma (Mar), Delta (Apr), Epsilon (May)
    expect(postTitles).toEqual([
      'Alpha Post',
      'Beta Post',
      'Gamma Post',
      'Delta Post',
      'Epsilon Post',
    ]);
  });

  test('search and sort work together', async ({ page }) => {
    await page.goto('/archive');

    const searchInput = page.getByTestId('archive-search');
    const sortSelect = page.getByTestId('archive-sort');

    // Search for posts with tag1
    await searchInput.fill('tag1');

    // Sort by title descending
    await sortSelect.selectOption('title-desc');

    const postTitles = await page.locator('[data-title]:visible').evaluateAll(
      (elements) => elements.map((el) => el.getAttribute('data-title'))
    );

    // Posts with tag1 are: Alpha, Gamma, Epsilon
    // Sorted descending: Gamma, Epsilon, Alpha
    expect(postTitles).toEqual([
      'Gamma Post',
      'Epsilon Post',
      'Alpha Post',
    ]);
  });

  test('clears search shows all posts again', async ({ page }) => {
    await page.goto('/archive');

    const searchInput = page.getByTestId('archive-search');

    // Search for something
    await searchInput.fill('Alpha');
    await expect(page.getByText('Beta Post')).not.toBeVisible();

    // Clear search
    await searchInput.fill('');

    // All posts should be visible again
    await expect(page.getByText('Alpha Post')).toBeVisible();
    await expect(page.getByText('Beta Post')).toBeVisible();
    await expect(page.getByText('Gamma Post')).toBeVisible();
    await expect(page.getByText('Delta Post')).toBeVisible();
    await expect(page.getByText('Epsilon Post')).toBeVisible();
  });
});
