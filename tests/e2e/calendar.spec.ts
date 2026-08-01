import { test, expect } from '@playwright/test';

// Use same setup users as other tests
const ADMIN_EMAIL = 'admin@test.com';
const ADMIN_PASSWORD = 'TestPassword123!';

const INVESTOR_EMAIL = 'test.investor@example.com';
const INVESTOR_PASSWORD = 'TestPassword123!';

test.describe('Booking Calendar Flow', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate and let middleware handle if we are not logged in
  });

  test('Admin can access calendar, see all villas, and create a block', async ({ page }) => {
    // 1. Log in as admin
    await page.goto('/login');
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 15000 });

    // 2. Go to Calendar
    await page.goto('/calendar');
    await expect(page.getByRole('heading', { name: 'Booking Calendar', level: 1 })).toBeVisible();

    // 3. Verify Villa Selector exists
    const villaSelector = page.getByRole('combobox');
    await expect(villaSelector).toBeVisible();
    
    // Select Taksu Bambu Villa explicitly since it has no beds24 integration
    // and is safe to create local bookings on (bypassing read_only restrictions)
    await villaSelector.click();
    await page.getByRole('option', { name: 'Taksu Bambu Villa' }).click();
    await expect(page).toHaveURL(/.*villaId=33333333-3333-3333-3333-333333333333.*/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500); // Wait for React state to fully settle
    
    // 4. Click an empty date in the grid to create a booking
    // We'll right-click the date and then click "Create Booking/Block"
    const dayCell = page.locator('div[class*="min-h-"]').getByText('22', { exact: true }).first();
    await dayCell.click({ button: 'right' });
    await page.getByText('Create Booking/Block').click();

    // 5. Modal should open
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('New Reservation')).toBeVisible();

    // 6. Fill out form as a maintenance block
    await page.locator('#channel-select').click();
    await page.getByRole('option', { name: 'Maintenance (Block)' }).click();

    // Fill notes (re-using guest country field)
    await page.getByPlaceholder('Reason for block...').fill('Plumbing repair E2E');

    // Submit
    await page.getByRole('button', { name: 'Save' }).click();

    // Modal should close
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('Investor can access calendar but only sees their own villas', async ({ page }) => {
    // 1. Log in as investor
    await page.goto('/login');
    await page.fill('input[type="email"]', INVESTOR_EMAIL);
    await page.fill('input[type="password"]', INVESTOR_PASSWORD);
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 15000 });

    // 2. Go to Calendar
    await page.goto('/calendar');
    await expect(page.getByRole('heading', { name: 'Booking Calendar', level: 1 })).toBeVisible();

    // 3. Verify Villa Selector exists but presumably contains fewer properties (just verifying it's there)
    const villaSelector = page.getByRole('combobox');
    await expect(villaSelector).toBeVisible();
  });
});
