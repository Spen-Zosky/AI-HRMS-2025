const { test, expect } = require('@playwright/test');

test.describe('HRMS Dashboard Tests', () => {
  test('should load dashboard and display main elements', async ({ page }) => {
    // Navigate to the dashboard
    await page.goto('/');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check if the dashboard loads (should redirect to login if not authenticated)
    await expect(page).toHaveTitle(/AI-HRMS 2025/);

    // Check if React app root element exists
    const root = page.locator('#root');
    await expect(root).toBeVisible();
  });

  test('should navigate to employees page', async ({ page }) => {
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    // Should have the main app structure
    const root = page.locator('#root');
    await expect(root).toBeVisible();
  });

  test('should navigate to leave management page', async ({ page }) => {
    await page.goto('/leave');
    await page.waitForLoadState('networkidle');

    // Should have the main app structure
    const root = page.locator('#root');
    await expect(root).toBeVisible();
  });
});

test.describe('API Integration Tests', () => {
  test('should make API calls to backend', async ({ page }) => {
    // Listen for API calls
    const apiCalls = [];
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        apiCalls.push(request.url());
      }
    });

    await page.goto('/employees');
    await page.waitForTimeout(2000); // Wait for API calls

    // Verify API calls were made (even if they return auth errors)
    expect(apiCalls.length).toBeGreaterThan(0);
  });
});