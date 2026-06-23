import { test, expect } from '@playwright/test';

test.describe('Owner Requests Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test.investor@example.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/);
  });

  test('User can navigate to Requests page and see the list', async ({ page }) => {
    await page.click('nav a:has-text("Requests")');
    await expect(page).toHaveURL(/.*\/requests/);
    
    // Expect the page title
    await expect(page.locator('h1:has-text("Owner Requests")')).toBeVisible();

    // Expect a "New Request" button to exist
    await expect(page.locator('button:has-text("New Request"), a:has-text("New Request")')).toBeVisible();
  });

  test('User can open the New Request form', async ({ page }) => {
    await page.goto('/requests');
    
    // Open the new request modal/page
    await page.click('button:has-text("New Request"), a:has-text("New Request")');
    
    // Expect form fields to be visible
    await expect(page.locator('label:has-text("Subject")')).toBeVisible();
    await expect(page.locator('label:has-text("Description")')).toBeVisible();
    
    // We do not submit it here to avoid polluting the DB on every test run,
    // or we could submit and then have a cleanup step.
  });
});
