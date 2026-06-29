import { test, expect } from '@playwright/test';

test.describe('Settings Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as investor for these tests
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test.investor@example.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 15000 });
  });

  test('Investor can access Settings page and view all tabs', async ({ page }) => {
    await page.goto('/settings');
    await expect(page).toHaveURL(/.*\/settings/);

    // Verify main header
    await expect(page.locator('h1', { hasText: 'Profile & Settings' })).toBeVisible();

    // Verify tabs
    await expect(page.locator('button[role="tab"]', { hasText: 'Personal Information' })).toBeVisible();
    await expect(page.locator('button[role="tab"]', { hasText: 'Tax Profile' })).toBeVisible();
    await expect(page.locator('button[role="tab"]', { hasText: 'Preferences' })).toBeVisible();
    await expect(page.locator('button[role="tab"]', { hasText: 'Banking & Payout' })).toBeVisible();

    // Verify Personal Information content
    await expect(page.locator('h3', { hasText: 'Passport Details' })).toBeVisible();
    await expect(page.locator('label', { hasText: 'Full Name' })).toBeVisible();

    // Navigate to Tax Profile
    await page.locator('button[role="tab"]', { hasText: 'Tax Profile' }).click();
    await expect(page.locator('h2', { hasText: 'Tax Profile' })).toBeVisible();
    await expect(page.locator('label', { hasText: 'TIN Number' })).toBeVisible();

    // Navigate to Preferences
    await page.locator('button[role="tab"]', { hasText: 'Preferences' }).click();
    await expect(page.locator('h2', { hasText: 'Communication Preferences' })).toBeVisible();
    await expect(page.locator('label', { hasText: 'Reporting Frequency' })).toBeVisible();

    // Navigate to Banking
    await page.locator('button[role="tab"]', { hasText: 'Banking & Payout' }).click();
    await expect(page.locator('h2', { hasText: 'Banking Information' })).toBeVisible();
    await expect(page.locator('label', { hasText: 'Payout Currency' })).toBeVisible();
  });
});
