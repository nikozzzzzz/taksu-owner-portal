import { test, expect } from '@playwright/test';

test.describe('Admin Pools CRUD', () => {
  // Login before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 15000 });
  });

  test('Admin can create, edit, and delete a pool', async ({ page }) => {
    const poolName = `Test Pool ${Date.now()}`;
    
    // 1. Access Pools Page
    await page.goto('/admin/pools');
    await expect(page).toHaveURL(/.*\/admin\/pools/);
    await expect(page.locator('text=Manage Pools')).toBeVisible();

    // 2. Create Pool
    await page.click('button:has-text("Create Pool")');
    await expect(page.locator('text=Create Pool')).toBeVisible();
    await page.fill('input[name="name"]', poolName);
    await page.fill('textarea[name="description"]', 'A test pool for E2E tests');
    await page.selectOption('select[name="villa_type"]', '1br');
    await page.selectOption('select[id="yield_formula_id"]', { label: 'Equal Share' });
    // Ensure active is checked
    const activeCheckbox = page.locator('button[role="switch"]');
    const isChecked = await activeCheckbox.getAttribute('aria-checked');
    if (isChecked === 'false') {
      await activeCheckbox.click();
    }
    await page.click('button:has-text("Save")');
    
    // Verify creation
    await expect(page.locator(`text=${poolName}`)).toBeVisible({ timeout: 15000 });

    // 3. Edit Pool
    // Find the row for the created pool and click the edit button
    const row = page.locator('tr', { hasText: poolName });
    await row.locator('button').nth(1).click(); // Assuming 2nd button is Edit (1st is Reports)
    
    await expect(page.locator('text=Edit Pool')).toBeVisible();
    // Change yield formula to revenue_weighted
    await page.selectOption('select[id="yield_formula_id"]', { label: 'Revenue Weighted' });
    await page.click('button:has-text("Save")');

    // Verify edit (the text revenue weighted should be visible in the row)
    await expect(row.locator('text=revenue weighted')).toBeVisible();

    // 4. Delete Pool
    // Handle dialog
    page.once('dialog', dialog => dialog.accept());
    await row.locator('button').nth(2).click(); // Assuming 3rd button is Delete
    
    // Verify deletion
    await expect(page.locator(`text=${poolName}`)).not.toBeVisible();
  });
});
