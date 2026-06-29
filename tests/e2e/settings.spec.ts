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

    // Verify Personal Information content and submit
    await expect(page.locator('h3', { hasText: 'Passport Details' })).toBeVisible();
    await expect(page.locator('label', { hasText: 'Full Name' })).toBeVisible();
    await page.locator('button', { hasText: 'Save Changes' }).first().click();
    await expect(page.locator('text=Profile updated successfully.')).toBeVisible({ timeout: 10000 });

    // Navigate to Tax Profile and submit
    await page.locator('button[role="tab"]', { hasText: 'Tax Profile' }).click();
    await expect(page.locator('h2', { hasText: 'Tax Profile' })).toBeVisible();
    await expect(page.locator('label', { hasText: 'TIN Number' })).toBeVisible();
    await page.locator('button', { hasText: 'Save Tax Profile' }).click();
    await expect(page.locator('text=Tax profile updated successfully.')).toBeVisible({ timeout: 10000 });

    // Navigate to Preferences and submit
    await page.locator('button[role="tab"]', { hasText: 'Preferences' }).click();
    await expect(page.locator('h2', { hasText: 'Communication Preferences' })).toBeVisible();
    await expect(page.locator('label', { hasText: 'Reporting Frequency' })).toBeVisible();
    await page.locator('button', { hasText: 'Save Preferences' }).click();
    await expect(page.locator('text=Preferences updated successfully.')).toBeVisible({ timeout: 10000 });

    // Navigate to Banking and submit
    await page.locator('button[role="tab"]', { hasText: 'Banking & Payout' }).click();
    await expect(page.locator('h2', { hasText: 'Banking Information' })).toBeVisible();
    await expect(page.locator('label', { hasText: 'Payout Currency' })).toBeVisible();
    
    // Test the Banking submission (which requires ReAuth)
    await page.locator('button', { hasText: 'Save Banking Details' }).click();
    
    // Handle the ReAuth Dialog
    await expect(page.locator('text=Confirm your identity')).toBeVisible();
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.locator('button', { hasText: 'Confirm', exact: true }).click();
    
    // Check for banking update success
    await expect(page.locator('text=Banking details updated securely.')).toBeVisible({ timeout: 10000 });
  });
});
