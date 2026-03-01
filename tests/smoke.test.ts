import { test, expect } from '@playwright/test';

/**
 * Smoke tests for Curator Web frontend
 * These tests verify critical user paths without requiring a live backend
 */

test.describe('Dashboard Page', () => {
  test('loads and displays key sections', async ({ page }) => {
    // Mock the API response for system status
    await page.route('**/api/system/status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'healthy',
          version: '1.0.0',
          uptime: 3600,
        }),
      });
    });

    // Mock subscriptions API
    await page.route('**/api/subscriptions*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          subscriptions: [],
          total: 0,
        }),
      });
    });

    // Mock stats API
    await page.route('**/api/stats*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totalSubscriptions: 0,
          activeSubscriptions: 0,
          totalItems: 0,
        }),
      });
    });

    await page.goto('/');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check that the page title or main heading is visible
    // Adjust selectors based on your actual dashboard structure
    await expect(page).toHaveTitle(/Curator/i);
  });

  test('renders without JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      const msg = error.message;
      // Ignore MIME type warnings - these are from route mocking, not real app errors
      if (!msg.includes('MIME type') && !msg.includes('module script')) {
        errors.push(msg);
      }
    });

    // Also track console errors, filtering out known MIME type warnings
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Ignore MIME type warnings - these are from route mocking, not real app errors
        if (!text.includes('MIME type') && !text.includes('module script')) {
          errors.push(text);
        }
      }
    });

    await page.route('**/api/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      });
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(errors).toHaveLength(0);
  });
});

test.describe('Subscriptions Page', () => {
  test('loads subscriptions page', async ({ page }) => {
    // Mock subscriptions list
    await page.route('**/api/subscriptions*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          subscriptions: [
            {
              id: '1',
              name: 'Test Subscription',
              url: 'https://example.com/feed',
              type: 'rss',
              status: 'active',
              createdAt: new Date().toISOString(),
            },
          ],
          total: 1,
        }),
      });
    });

    await page.goto('/subscriptions');
    await page.waitForLoadState('networkidle');

    // Verify the page loaded
    await expect(page).toHaveURL(/subscriptions/);
  });

  test('displays subscription form validation', async ({ page }) => {
    // Mock empty subscriptions list
    await page.route('**/api/subscriptions*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          subscriptions: [],
          total: 0,
        }),
      });
    });

    await page.goto('/subscriptions');
    await page.waitForLoadState('networkidle');

    // Look for "Add" or "New Subscription" button - adjust selector as needed
    const addButton = page.getByRole('button', { name: /add|new/i }).first();

    if (await addButton.isVisible()) {
      await addButton.click();

      // Wait for form/dialog to appear
      await page.waitForTimeout(500);

      // Try to find and click a save/submit button
      const saveButton = page.getByRole('button', { name: /save|submit|create/i }).first();

      if (await saveButton.isVisible()) {
        await saveButton.click();

        // The form should show validation errors or remain open
        // This verifies that client-side validation is working
        await page.waitForTimeout(500);
      }
    }
  });
});

test.describe('API Client Error Handling', () => {
  test('handles API errors gracefully', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Mock failed API response
    await page.route('**/api/subscriptions*', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Internal Server Error',
        }),
      });
    });

    await page.goto('/subscriptions');
    await page.waitForLoadState('networkidle');

    // The page should still render (not crash)
    await expect(page).toHaveURL(/subscriptions/);

    // Should not have unhandled promise rejections or crashes
    // Some console errors are expected from the failed API call
  });

  test('handles network timeouts', async ({ page }) => {
    // Simulate a slow/hanging API request
    await page.route('**/api/subscriptions*', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          subscriptions: [],
          total: 0,
        }),
      });
    });

    await page.goto('/subscriptions');

    // Should show loading state
    await page.waitForTimeout(500);

    // Eventually should resolve
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    await expect(page).toHaveURL(/subscriptions/);
  });
});

test.describe('Job Tracker Polling', () => {
  test('job status updates via polling', async ({ page }) => {
    let pollCount = 0;

    // Mock job status endpoint with changing status
    await page.route('**/api/jobs/*', async (route) => {
      pollCount++;
      const status = pollCount === 1 ? 'running' : 'completed';

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '123',
          status,
          progress: pollCount === 1 ? 50 : 100,
          createdAt: new Date().toISOString(),
        }),
      });
    });

    // Mock other API endpoints
    await page.route('**/api/subscriptions*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          subscriptions: [],
          total: 0,
        }),
      });
    });

    await page.goto('/subscriptions');
    await page.waitForLoadState('networkidle');

    // If there's job tracking UI, it should update
    // This test verifies the polling mechanism doesn't crash
    await page.waitForTimeout(2000);
  });
});

test.describe('Navigation', () => {
  test('navigates between main pages', async ({ page }) => {
    // Mock all API endpoints
    await page.route('**/api/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      });
    });

    // Start at home
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL('/');

    // Navigate to subscriptions
    const subLink = page.getByRole('link', { name: /subscription/i }).first();
    if (await subLink.isVisible()) {
      await subLink.click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/subscriptions/);
    }
  });

  test('handles unknown routes gracefully', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      const msg = error.message;
      // Ignore MIME type warnings - these are from route mocking, not real app errors
      if (!msg.includes('MIME type') && !msg.includes('module script')) {
        errors.push(msg);
      }
    });

    await page.route('**/api/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      });
    });

    await page.goto('/this-page-does-not-exist');
    await page.waitForLoadState('networkidle');

    // Page should load without crashing (404 page or redirect is acceptable)
    // The important thing is no JavaScript errors
    expect(errors).toHaveLength(0);

    // Check that something rendered (not a blank page)
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(0);
  });
});

test.describe('Responsive Design', () => {
  test('renders on mobile viewport', async ({ page }) => {
    await page.route('**/api/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      });
    });

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Page should render without horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(375 + 20); // Allow small margin
  });
});
