import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = 'admin@test.com';
const ADMIN_PASSWORD = 'TestPassword123!';
const INVESTOR_EMAIL = 'test.investor@example.com';
const INVESTOR_PASSWORD = 'TestPassword123!';
const GUEST_EMAIL = 'guest@test.com';
const GUEST_PASSWORD = 'TestPassword123!';

test.describe('Accounting Module', () => {

  test.describe('RBAC Access', () => {
    test('Admin can access /accounting', async ({ page }) => {
      test.setTimeout(60000);
      await page.goto('/login');
      await page.fill('input[type="email"]', ADMIN_EMAIL);
      await page.fill('input[type="password"]', ADMIN_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/(dashboard|accounting)/, { timeout: 15000 });
      await page.goto('/accounting');
      await expect(page).toHaveURL(/\/accounting$/);
      await expect(page.locator('h1:has-text("Accounting")')).toBeVisible();
    });

    test('Investor is redirected away from /accounting', async ({ page }) => {
      test.setTimeout(60000);
      await page.goto('/login');
      await page.fill('input[type="email"]', INVESTOR_EMAIL);
      await page.fill('input[type="password"]', INVESTOR_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/dashboard/, { timeout: 15000 });
      await page.goto('/accounting');
      // Should be redirected to dashboard
      await expect(page).toHaveURL(/\/dashboard/);
    });

    test('Guest is redirected away from /accounting', async ({ page }) => {
      test.setTimeout(60000);
      await page.goto('/login');
      await page.fill('input[type="email"]', GUEST_EMAIL);
      await page.fill('input[type="password"]', GUEST_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/dashboard/, { timeout: 15000 });
      await page.goto('/accounting');
      await expect(page).toHaveURL(/\/dashboard/);
    });
  });

  test.describe('Admin Accounting Flows', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[type="email"]', ADMIN_EMAIL);
      await page.fill('input[type="password"]', ADMIN_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/dashboard/, { timeout: 15000 });
    });

    test('Entity selector shows Management Company', async ({ page }) => {
      test.setTimeout(60000);
      await page.goto('/accounting');
      await expect(page.getByRole('link', { name: 'PT Taksu Living Management' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Management Company' })).toBeVisible();
    });

    test('Admin can navigate to Management Company accounting', async ({ page }) => {
      test.setTimeout(60000);
      await page.goto('/accounting');
      await page.getByRole('link', { name: 'PT Taksu Living Management' }).click();
      await page.waitForURL(/\/accounting\/management_company\/mc/, { timeout: 15000 });
      await expect(page.getByRole('link', { name: 'Transactions', exact: true })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Invoices', exact: true })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Categories', exact: true })).toBeVisible();
    });

    test('Admin can create an expense transaction', async ({ page }) => {
      test.setTimeout(60000);
      const txTitle = `E2E Expense ${Date.now()}`;
      await page.goto('/accounting/management_company/mc');

      // Open dialog
      await page.locator('button:has-text("Add Transaction")').first().click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();

      // Select expense type (click inside dialog)
      await dialog.locator('button:has-text("expense")').click();

      // Select category
      const categorySelect = dialog.locator('select').first();
      await categorySelect.selectOption({ index: 1 });

      await page.fill('input[id="tx-title"]', txTitle);
      await page.fill('input[id="tx-amount"]', '150.00');
      await page.fill('input[id="tx-vendor"]', 'Test Vendor Inc.');

      // Submit — click the submit button inside the dialog
      await dialog.locator('button[type="submit"]').click();
      await expect(page.locator(`text=${txTitle}`)).toBeVisible({ timeout: 15000 });
    });

    test('Admin can create an income transaction', async ({ page }) => {
      test.setTimeout(60000);
      const txTitle = `E2E Income ${Date.now()}`;
      await page.goto('/accounting/management_company/mc');

      // Open dialog
      await page.locator('button:has-text("Add Transaction")').first().click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();

      // Select income type
      await dialog.locator('button:has-text("income")').click();

      const categorySelect = dialog.locator('select').first();
      await categorySelect.selectOption({ index: 1 });

      await page.fill('input[id="tx-title"]', txTitle);
      await page.fill('input[id="tx-amount"]', '500.00');

      // Submit
      await dialog.locator('button[type="submit"]').click();
      await expect(page.locator(`text=${txTitle}`)).toBeVisible({ timeout: 15000 });
    });

    test('Admin can filter transactions by type', async ({ page }) => {
      test.setTimeout(60000);
      await page.goto('/accounting/management_company/mc');

      // Open filters
      await page.click('button:has-text("Filters")');
      await expect(page.locator('text=Apply')).toBeVisible();

      // Select expense filter
      const typeSelect = page.locator('select').first();
      await typeSelect.selectOption('expense');
      await page.click('button:has-text("Apply")');

      // URL should update
      await expect(page).toHaveURL(/type=expense/);
    });

    test('Admin can search transactions', async ({ page }) => {
      test.setTimeout(60000);
      await page.goto('/accounting/management_company/mc');
      await page.fill('input[placeholder="Search..."]', 'E2E');
      await page.press('input[placeholder="Search..."]', 'Enter');
      await expect(page).toHaveURL(/search=E2E/);
    });

    test('CSV export link is present and has correct href', async ({ page }) => {
      test.setTimeout(60000);
      await page.goto('/accounting/management_company/mc');
      const exportLink = page.locator('a:has-text("Export CSV")');
      await expect(exportLink).toBeVisible();
      const href = await exportLink.getAttribute('href');
      expect(href).toContain('/api/accounting/export');
      expect(href).toContain('entity_type=management_company');
    });

    test('Admin can navigate to Categories tab', async ({ page }) => {
      test.setTimeout(60000);
      await page.goto('/accounting/management_company/mc');
      await page.getByRole('link', { name: 'Categories', exact: true }).click();
      await expect(page).toHaveURL(/tab=categories/, { timeout: 15000 });
      await expect(page.getByRole('heading', { name: 'Income Categories' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Expense Categories' })).toBeVisible();
      // Default categories should be seeded
      await expect(page.locator('text=Booking Revenue').first()).toBeVisible();
      await expect(page.locator('text=Staff Salaries').first()).toBeVisible();
    });

    test('Admin can create a category', async ({ page }) => {
      test.setTimeout(60000);
      const catName = `E2E Category ${Date.now()}`;
      await page.goto('/accounting/management_company/mc?tab=categories');

      await page.locator('button:has-text("Add Category")').first().click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();

      await page.fill('input[id="cat-name"]', catName);
      await dialog.locator('button:has-text("expense")').click();

      await dialog.locator('button[type="submit"]').click();
      await expect(page.locator(`text=${catName}`)).toBeVisible({ timeout: 15000 });
    });

    test('Admin can navigate to Invoices tab', async ({ page }) => {
      test.setTimeout(60000);
      await page.goto('/accounting/management_company/mc');
      await page.getByRole('link', { name: 'Invoices', exact: true }).click();
      await expect(page).toHaveURL(/tab=invoices/, { timeout: 15000 });
      await expect(page.getByRole('button', { name: 'Create Invoice' })).toBeVisible();
    });

    test('Admin can create an invoice', async ({ page }) => {
      test.setTimeout(60000);
      await page.goto('/accounting/management_company/mc?tab=invoices');

      await page.locator('button:has-text("Create Invoice")').first().click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();

      // Fill invoice form
      await page.fill('input[id="inv-number"]', `INV-E2E-${Date.now()}`);
      await page.fill('input[id="inv-title"]', 'E2E Test Invoice');
      await page.fill('input[id="inv-client"]', 'E2E Test Client');

      // Add line item
      const descInputs = dialog.locator('input[placeholder="Description..."]');
      await descInputs.first().fill('Test Service');
      const unitPriceInputs = dialog.locator('input[placeholder="0.00"]');
      await unitPriceInputs.first().fill('100.00');

      await dialog.locator('button[type="submit"]').click();

      // Should see the invoice in list
      await expect(page.locator('text=E2E Test Client')).toBeVisible({ timeout: 15000 });
    });

    test('Accounting link appears in sidebar for admin', async ({ page }) => {
      test.setTimeout(60000);
      await page.goto('/dashboard');
      await expect(page.locator('a[href="/accounting"]:has-text("Accounting")')).toBeVisible();
    });
  });
});
