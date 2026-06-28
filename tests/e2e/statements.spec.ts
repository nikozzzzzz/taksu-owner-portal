import { test, expect } from '@playwright/test';

test.describe('Statements Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as investor for these tests
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test.investor@example.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/);
  });

  test('User can navigate to Statements page and view list', async ({ page }) => {
    await page.click('nav a:has-text("Statements")');
    await expect(page).toHaveURL(/.*\/statements/);
    
    // Check header
    await expect(page.locator('h1:has-text("Financial Statements")')).toBeVisible();

    // Check if table or list renders (Wait for a statement card or row)
    // We expect the seed data to have statements for the investor's villa
    const statementRow = page.locator('text=August 2026').first();
    await expect(statementRow).toBeVisible();
  });

  test('User can view Statement Details', async ({ page }) => {
    await page.goto('/statements');
    
    // Click on the first statement row (it's clickable)
    const statementRow = page.locator('text=August 2026').first();
    await expect(statementRow).toBeVisible();
    await statementRow.click();

    // Verify detail page URL and elements
    await expect(page).toHaveURL(/.*\/statements\/.+/);
    await expect(page.locator('text=Gross Revenue')).toBeVisible();
    await expect(page.locator('text=Net Payout')).toBeVisible();
    await expect(page.locator('text=Download PDF')).toBeVisible();
  });
});
