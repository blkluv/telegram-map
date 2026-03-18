# E2E Tests

This project includes Playwright e2e tests to verify the site's functionality.

## Test Suites

- **smoke.spec.ts**: Basic smoke tests that verify pages load correctly
- **site-config.spec.ts**: Tests for siteConfig.json behavior (icon links, custom links, isBlogDisplayed, contactFormEnabled)
- **blog-archive.spec.ts**: Tests for archive page filtering and sorting

## Running Tests

### Prerequisites

1. Install dependencies:
```bash
pnpm install
```

2. Install Playwright browsers:
```bash
npx playwright install chromium --with-deps
```

### Run All Tests

```bash
pnpm exec playwright test
```

### Run Specific Test Suite

```bash
pnpm exec playwright test tests/e2e/smoke.spec.ts
pnpm exec playwright test tests/e2e/site-config.spec.ts
pnpm exec playwright test tests/e2e/blog-archive.spec.ts
```

### Run with UI

```bash
pnpm exec playwright test --ui
```

### View Test Report

```bash
pnpm exec playwright show-report
```

## Test Fixtures

Test fixtures are located in `tests/fixtures/`:

- `siteConfig-base.json`: Base config with 2 icon links and 3 custom links
- `siteConfig-no-blog.json`: Config with `isBlogDisplayed: false`
- `siteConfig-no-contact.json`: Config with `contactFormEnabled: false`
- `content/blog/test-post-*/index.md`: 5 minimal blog posts for testing archive functionality

## How Tests Work

### Site Config Tests

These tests swap out the real `src/siteConfig.json` with test fixtures to verify that configuration changes are properly reflected in the UI. The tests:

1. Back up the original config
2. Copy a test fixture to `src/siteConfig.json`
3. Load the page and verify the changes
4. Restore the original config

### Blog Archive Tests

These tests replace `src/content/blog/` with test fixtures to ensure the archive page filtering and sorting work correctly. The tests verify:

- Search by title, description, and tags
- Sort by title (ascending/descending)
- Sort by date (newest/oldest)
- Combinations of search + sort

## data-testid Attributes

The following test IDs are used throughout the codebase:

- `icon-link`: Individual icon links
- `icon-links-container`: Container for all icon links
- `custom-link`: Individual custom links
- `custom-links-container`: Container for all custom links
- `posts-section`: Blog posts section heading
- `posts-list`: List of blog posts
- `contact-section`: Contact form section heading
- `contact-form`: Contact form element
- `archive-search`: Search input on archive page
- `archive-sort`: Sort dropdown on archive page

## Configuration Changes

As part of setting up these tests, the following changes were made to the codebase:

1. **Renamed `blog` to `isBlogDisplayed`**: The `blog` boolean in `siteConfig.json` and `siteConfig.ts` has been renamed to `isBlogDisplayed` for clarity.

2. **Added data-testid attributes**: Test IDs have been added to key elements for reliable test targeting.
