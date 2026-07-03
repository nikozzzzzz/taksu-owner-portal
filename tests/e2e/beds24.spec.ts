import { test, expect } from '@playwright/test';

test.describe('Beds24 Integration', () => {
  // We mock the Beds24 API connection for testing since we don't have a real invite code
  // In a real scenario we'd use Playwright's route mocking.

  test('Admin can navigate to Beds24 settings page', async ({ page }) => {
    // 1. Login as admin
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 15000 });

    // 2. Access Beds24 Settings
    await page.goto('/admin/integrations/beds24');
    await expect(page).toHaveURL(/.*\/admin\/integrations\/beds24/);
    await expect(page.locator('text=Beds24 Integration')).toBeVisible();
    await expect(page.locator('text=Connection Status')).toBeVisible();
  });
  
  test('Webhook route processes incoming booking payloads', async ({ request }) => {
    // Simulate Beds24 webhook request
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

    const response = await request.post('/api/webhooks/beds24', {
      data: payload
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);

    // Note: The booking won't actually be inserted unless there's a Villa mapped
    // with beds24_property_id=88888 and beds24_room_id=77777 in the DB.
    // The test just ensures the webhook endpoint doesn't crash and returns 200.
  });
});
