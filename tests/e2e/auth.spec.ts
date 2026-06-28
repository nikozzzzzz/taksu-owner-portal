import { test, expect } from '@playwright/test';

test.describe('Authentication Flow & RBAC', () => {

  test('Guest user is redirected away from protected financial routes', async ({ page }) => {
    // 1. Login as guest
    await page.goto('/login');
    await page.fill('input[type="email"]', 'guest@test.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    // 2. Wait for dashboard (allowed for guest, but shows pending)
    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.locator('text=Account Pending Approval')).toBeVisible();

    // 3. Try to access statements
    await page.goto('/statements');
    
    // 4. Expect to be redirected back to dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);
  });

  test('Investor user can access financial routes but not admin', async ({ page }) => {
    // 1. Login as investor
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test.investor@example.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    // 2. Access dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);

    // 3. Access statements (should work)
    await page.goto('/statements');
    await expect(page).toHaveURL(/.*\/statements/);
    await expect(page.locator('text=Financial Statements')).toBeVisible();

    // 4. Try to access admin panel (should be blocked)
    await page.goto('/admin/users');
    await expect(page).toHaveURL(/.*\/dashboard/);
  });

  test('Admin user can access Admin Panel', async ({ page }) => {
    // 1. Login as admin
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    // 2. Access Admin Users
    await expect(page).toHaveURL(/.*\/dashboard/);
    await page.goto('/admin/users');
    await expect(page).toHaveURL(/.*\/admin\/users/);
    await expect(page.locator('text=User Management')).toBeVisible();
  });

  test('Unauthenticated users are redirected to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*\/login/);
  });
});
