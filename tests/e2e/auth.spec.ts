import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  
  test('User can login successfully and access dashboard', async ({ page, baseURL }) => {
    await page.goto('/login');
    
    // Fill in the login form
    await page.fill('input[type="email"]', 'test.investor@example.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Expect to be redirected to dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);
    
    // Verify dashboard content is visible
    await expect(page.locator('text=Taksu Living')).toBeVisible();
  });

  test('User is redirected back to login after logging out', async ({ page }) => {
    // 1. Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test.investor@example.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);

    // 2. Perform Logout
    // Assuming the user menu/logout button is in the header/sidebar
    // Click the user menu avatar or directly click Logout if visible
    // Note: Adjust the selectors based on the exact DOM structure of your shadcn dropdown
    await page.click('button:has-text("Logout"), a:has-text("Logout"), [aria-label="User Menu"], [aria-label="Profile"]');
    
    // If it was a dropdown, click the Sign out option
    const signOutBtn = page.locator('text=Log out');
    if (await signOutBtn.isVisible()) {
      await signOutBtn.click();
    }
    
    // 3. Verify successful redirect back to /login (instead of localhost)
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('Protected routes redirect to login when unauthenticated', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should be redirected to login
    await expect(page).toHaveURL(/.*\/login/);
  });
});
