import { test, expect } from '@playwright/test';

test.describe('Carousel Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('carousel container exists and is visible', async ({ page }) => {
    const carouselContainer = page.getByTestId('carousel-container');
    await expect(carouselContainer).toBeVisible();
  });

  test('carousel displays correct number of slides', async ({ page }) => {
    const slides = page.getByTestId('carousel-slide');
    // The test config has 4 carousel images
    await expect(slides).toHaveCount(4);
  });

  test('carousel displays correct number of navigation dots', async ({ page }) => {
    const dots = page.getByTestId('carousel-dots').locator('.carousel-dot');
    // The test config has 4 carousel images, so 4 dots
    await expect(dots).toHaveCount(4);
  });

  test('first dot is active initially', async ({ page }) => {
    const firstDot = page.getByTestId('carousel-dot-0');
    await expect(firstDot).toHaveClass(/active/);
  });

  test('clicking navigation dot changes slide', async ({ page }) => {
    const track = page.getByTestId('carousel-track');
    const secondDot = page.getByTestId('carousel-dot-1');
    const firstDot = page.getByTestId('carousel-dot-0');

    // Initially, first dot should be active
    await expect(firstDot).toHaveClass(/active/);

    // Click second dot
    await secondDot.click();

    // Wait for transition
    await page.waitForTimeout(100);

    // Second dot should now be active
    await expect(secondDot).toHaveClass(/active/);
    await expect(firstDot).not.toHaveClass(/active/);

    // Track should have moved
    const transform = await track.evaluate((el) =>
      window.getComputedStyle(el).transform
    );
    // Should be translated to show second slide (translateX(-100%))
    expect(transform).toContain('matrix');
  });

  test('clicking next arrow advances slide', async ({ page }) => {
    const nextBtn = page.getByTestId('carousel-next');
    const firstDot = page.getByTestId('carousel-dot-0');
    const secondDot = page.getByTestId('carousel-dot-1');

    // Initially on first slide
    await expect(firstDot).toHaveClass(/active/);

    // Hover over carousel to make arrow visible
    const carouselContainer = page.getByTestId('carousel-container');
    await carouselContainer.hover();

    // Click next button
    await nextBtn.click();

    // Wait for transition
    await page.waitForTimeout(100);

    // Should be on second slide
    await expect(secondDot).toHaveClass(/active/);
    await expect(firstDot).not.toHaveClass(/active/);
  });

  test('clicking prev arrow goes to previous slide', async ({ page }) => {
    const prevBtn = page.getByTestId('carousel-prev');
    const nextBtn = page.getByTestId('carousel-next');
    const firstDot = page.getByTestId('carousel-dot-0');
    const secondDot = page.getByTestId('carousel-dot-1');

    const carouselContainer = page.getByTestId('carousel-container');
    await carouselContainer.hover();

    // First advance to second slide
    await nextBtn.click();
    await page.waitForTimeout(100);
    await expect(secondDot).toHaveClass(/active/);

    // Then click prev to go back
    await prevBtn.click();
    await page.waitForTimeout(100);

    // Should be back on first slide
    await expect(firstDot).toHaveClass(/active/);
    await expect(secondDot).not.toHaveClass(/active/);
  });

  test('clicking carousel navigation does not navigate to link', async ({ page }) => {
    const nextBtn = page.getByTestId('carousel-next');
    const carouselContainer = page.getByTestId('carousel-container');

    // Hover to show controls
    await carouselContainer.hover();

    // Get current URL
    const initialUrl = page.url();

    // Click next button
    await nextBtn.click();

    // Wait a bit
    await page.waitForTimeout(200);

    // URL should not have changed
    expect(page.url()).toBe(initialUrl);
  });

  test('clicking carousel dot does not navigate to link', async ({ page }) => {
    const secondDot = page.getByTestId('carousel-dot-1');

    // Get current URL
    const initialUrl = page.url();

    // Click dot
    await secondDot.click();

    // Wait a bit
    await page.waitForTimeout(200);

    // URL should not have changed
    expect(page.url()).toBe(initialUrl);
  });

  test('clicking link title navigates to URL', async ({ page }) => {
    // Find the carousel link by its title
    const carouselLink = page.getByText('Carousel Link').first();

    // Get the parent link element
    const linkElement = page.locator('[data-testid="custom-link"]').filter({
      has: page.getByText('Carousel Link')
    });

    // Click on the title/description area (not the carousel controls)
    await carouselLink.click();

    // Wait for navigation
    await page.waitForTimeout(500);

    // URL should have changed to the carousel link URL
    expect(page.url()).toContain('/carousel');
  });

  test('carousel wraps around from last to first slide', async ({ page }) => {
    const nextBtn = page.getByTestId('carousel-next');
    const firstDot = page.getByTestId('carousel-dot-0');
    const lastDot = page.getByTestId('carousel-dot-3');

    const carouselContainer = page.getByTestId('carousel-container');
    await carouselContainer.hover();

    // Click next 4 times to go through all slides and wrap around
    for (let i = 0; i < 4; i++) {
      await nextBtn.click();
      await page.waitForTimeout(100);
    }

    // Should be back on first slide
    await expect(firstDot).toHaveClass(/active/);
  });

  test('carousel wraps around from first to last slide when clicking prev', async ({ page }) => {
    const prevBtn = page.getByTestId('carousel-prev');
    const firstDot = page.getByTestId('carousel-dot-0');
    const lastDot = page.getByTestId('carousel-dot-3');

    const carouselContainer = page.getByTestId('carousel-container');
    await carouselContainer.hover();

    // Initially on first slide
    await expect(firstDot).toHaveClass(/active/);

    // Click prev to wrap to last slide
    await prevBtn.click();
    await page.waitForTimeout(100);

    // Should be on last slide
    await expect(lastDot).toHaveClass(/active/);
  });

  test('carousel auto-plays through slides', async ({ page }) => {
    const firstDot = page.getByTestId('carousel-dot-0');
    const secondDot = page.getByTestId('carousel-dot-1');

    // Initially on first slide
    await expect(firstDot).toHaveClass(/active/);

    // Wait for auto-play (4 seconds + buffer)
    await page.waitForTimeout(4500);

    // Should have advanced to second slide
    await expect(secondDot).toHaveClass(/active/);
  });

  test('carousel pauses auto-play on hover', async ({ page }) => {
    const carouselContainer = page.getByTestId('carousel-container');
    const firstDot = page.getByTestId('carousel-dot-0');

    // Initially on first slide
    await expect(firstDot).toHaveClass(/active/);

    // Hover over carousel to pause
    await carouselContainer.hover();

    // Wait longer than auto-play duration
    await page.waitForTimeout(5000);

    // Should still be on first slide (paused)
    await expect(firstDot).toHaveClass(/active/);
  });

  test('navigation arrows are hidden by default and visible on hover', async ({ page }) => {
    const nextBtn = page.getByTestId('carousel-next');
    const prevBtn = page.getByTestId('carousel-prev');
    const carouselContainer = page.getByTestId('carousel-container');

    // Arrows should have opacity 0 initially
    const initialOpacity = await nextBtn.evaluate((el) =>
      window.getComputedStyle(el).opacity
    );
    expect(parseFloat(initialOpacity)).toBe(0);

    // Hover over carousel
    await carouselContainer.hover();

    // Wait for transition
    await page.waitForTimeout(300);

    // Arrows should now be visible (opacity 1)
    const hoverOpacity = await nextBtn.evaluate((el) =>
      window.getComputedStyle(el).opacity
    );
    expect(parseFloat(hoverOpacity)).toBeGreaterThan(0.9);
  });

  test('all carousel images have correct alt text', async ({ page }) => {
    const carouselContainer = page.getByTestId('carousel-container');
    const images = carouselContainer.locator('img');

    // Check each image has an alt attribute
    const count = await images.count();
    expect(count).toBe(4);

    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute('alt');
      expect(alt).toBeTruthy();
      // Should match either the specific alt text or the title
      expect(alt).toMatch(/Example image \d+|Carousel Link/);
    }
  });
});
