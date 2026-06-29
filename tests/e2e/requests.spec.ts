import { test, expect } from '@playwright/test';

test.describe('Owner Requests Flow', () => {
  const subjectStr = `E2E Test Request ${Date.now()}`;

  test('End-to-End: Investor creates request, Admin approves it', async ({ page, browser }) => {
    // ---- 1. INVESTOR CREATES REQUEST ----
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test.investor@example.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 15000 });

    await page.goto('/requests');
    
    // Open the new request modal/page
    await page.click('button:has-text("New Request")');
    
    // Fill the form (using default 'General' category)
    await page.fill('input[name="subject"]', subjectStr);
    await page.fill('textarea[name="description"]', 'This is a test description for E2E flow.');
    await page.click('button[type="submit"]:has-text("Submit Request")');
    
    // Wait for redirect to detail page and subject to appear
    await expect(page).toHaveURL(/.*\/requests\/.+/, { timeout: 15000 });
    await expect(page.locator(`h1:has-text("${subjectStr}")`)).toBeVisible();

    // Sign out
    await page.goto('/login'); // Forces logout or we can click logout

    // ---- 2. ADMIN APPROVES REQUEST ----
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    
    await adminPage.goto('/login');
    await adminPage.fill('input[type="email"]', 'admin@test.com');
    await adminPage.fill('input[type="password"]', 'TestPassword123!');
    await adminPage.click('button[type="submit"]');
    await expect(adminPage).toHaveURL(/.*\/dashboard/, { timeout: 15000 });

    // Go to requests (Admin sees all)
    await adminPage.goto('/requests');
    await expect(adminPage.locator(`text=${subjectStr}`)).toBeVisible();

    // Click on the request
    await adminPage.click(`text=${subjectStr}`);

    // Inside detail view, we should see admin actions
    await expect(adminPage.locator('text=Admin Actions:')).toBeVisible();

    // Change status to Approved
    await adminPage.click('button:has-text("Approve")');

    // Wait for status update
    await expect(adminPage.locator('.bg-taksu-jungle\\/10')).toBeVisible(); // Hacky check for green status badge
    // Also "Admin Actions:" might be updated if status is terminal, but approved is not terminal
    
    // Check timeline shows Approved
    await expect(adminPage.locator('text=Approved')).toBeVisible();

    await adminContext.close();
  });
});
