import { test, expect } from '@playwright/test';

test.describe('Dashboard Flow', () => {
  // Login before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test.investor@example.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 15000 });
  });

  test('Dashboard loads critical components successfully', async ({ page }) => {
    // Check if the dashboard title is visible
    await expect(page.locator('h1.portal-page-title')).toBeVisible();

    // Check if Year-to-Date metric card is visible
    await expect(page.locator('text=Year-to-Date')).toBeVisible();

    // Check if Gross Revenue metric is visible
    await expect(page.locator('text=Gross Revenue')).toBeVisible();

    // Check if Recent Bookings section or Pool Position is visible
    // Note: These selectors are based on typical shadcn card titles or texts.
    // Ensure the seed data creates at least one element matching these.
    await expect(page.locator('text=Pool Position').first()).toBeVisible();
    await expect(page.locator('text=Recent Bookings').first()).toBeVisible();
  });

  test('Sidebar navigation works from Dashboard', async ({ page }) => {
    // Navigate to Statements
    await page.click('nav a:has-text("Statements")');
    await expect(page).toHaveURL(/.*\/statements/);

    // Navigate to Pool Position
    await page.click('nav a:has-text("Pool Position")');
    await expect(page).toHaveURL(/.*\/pool-position/);

    // Navigate back to Dashboard
    await page.click('nav a:has-text("Dashboard")');
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 15000 });
  });
});
