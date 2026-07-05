import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = 'admin@test.com';
const ADMIN_PASSWORD = 'TestPassword123!';

test.describe('Beds24 Integration', () => {

  test('Admin can navigate to Beds24 settings page', async ({ page }) => {
    // 1. Login as admin
    await page.goto('/login');
    // Use type="email" selector consistent with other spec files
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 15000 });

    // 2. Access Beds24 Settings (admin-only page)
    await page.goto('/admin/integrations/beds24');
    await expect(page).toHaveURL(/.*\/admin\/integrations\/beds24/);
    await expect(page.locator('h1:has-text("Beds24 Integration")')).toBeVisible();
    await expect(page.locator('text=Connection Status')).toBeVisible();
  });

  test('Webhook route accepts valid payload and returns 200', async ({ request }) => {
    // Simulate Beds24 webhook request.
    // The webhook may require BEDS24_WEBHOOK_SECRET if configured.
    // In the test environment, BEDS24_WEBHOOK_SECRET should be unset or match TEST_WEBHOOK_SECRET.
    const payload = {
      id: 9999999,
      propertyId: 88888,
      roomId: 77777,
      arrival: '2026-08-01',
      departure: '2026-08-05',
      firstName: 'John',
      lastName: 'Beds24Test',
      status: '1',
      price: 500,
      apiSource: 'booking.com'
    };

    const headers: Record<string, string> = {};
    // If a secret is configured in the test environment, send it
    if (process.env.BEDS24_WEBHOOK_SECRET) {
      headers['x-beds24-secret'] = process.env.BEDS24_WEBHOOK_SECRET;
    }

    const response = await request.post('/api/webhooks/beds24', {
      data: payload,
      headers,
    });

    // The endpoint should return 200 regardless of whether the villa mapping exists.
    // It gracefully skips bookings with no matching villa.
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);

    // Note: The booking won't actually be inserted since no Villa is mapped
    // with beds24_property_id=88888 and beds24_room_id=77777 in the test DB.
    // The test verifies the endpoint handles unknown mappings gracefully (skip, not crash).
    expect(Array.isArray(data.results)).toBe(true);
  });
});
