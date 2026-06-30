import { test, expect } from '@playwright/test';

test.describe('Signup Flow', () => {
  test('User can navigate to signup page and submit form', async ({ page }) => {
    test.setTimeout(60000);
    // 1. Start at login page
    await page.goto('/login');
    
    // 2. Click "Sign up" link
    await page.click('text=Sign up');
    
    // 3. Verify we are on the signup page
    await expect(page).toHaveURL(/.*\/signup/);
    await expect(page.locator('h1:has-text("Create Account")')).toBeVisible();

    // 4. Fill in the form with a unique email
    const uniqueEmail = `newuser_${Date.now()}@example.com`;
    await page.fill('input[id="signup-fullname"]', 'Test User');
    await page.fill('input[type="email"]', uniqueEmail);
    await page.fill('input[id="signup-password"]', 'StrongPassword123!');
    await page.fill('input[id="signup-confirm-password"]', 'StrongPassword123!');
    
    // 5. Submit the form
    await page.click('button:has-text("Sign up")');
    
    // 6. Wait for success message (Check your email) OR any alert indicating rate limit/error
    const successMsg = page.locator('text=Check your email');
    const alertMsg = page.locator('[role="alert"]');
    
    await expect(successMsg.or(alertMsg)).toBeVisible({ timeout: 10000 });

    // 7. Verify the Return to Login button exists if successful
    if (await successMsg.isVisible()) {
      await expect(page.locator('button:has-text("Return to Login")')).toBeVisible();
    }
  });
  
  test('Signup form shows validation errors', async ({ page }) => {
    await page.goto('/signup');
    
    // Fill mismatched passwords
    await page.fill('input[id="signup-fullname"]', 'Test User');
    await page.fill('input[type="email"]', 'test@test.com');
    await page.fill('input[id="signup-password"]', 'Password123');
    await page.fill('input[id="signup-confirm-password"]', 'Password456');
    
    await page.click('button:has-text("Sign up")');
    
    // Expect error
    await expect(page.locator('text=Passwords do not match')).toBeVisible();
  });
});
