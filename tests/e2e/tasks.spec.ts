import { test, expect } from '@playwright/test';

test.describe('Tasks Board (Kanban)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 15000 });
  });

  test('Admin can create a project, columns, and tasks', async ({ page }) => {
    test.setTimeout(120000);
    const projectName = `Test Project ${Date.now()}`;
    const columnName = `To Do ${Date.now()}`;
    const taskName = `Test Task ${Date.now()}`;

    // 1. Go to Tasks
    await page.goto('/tasks');
    await expect(page.locator('text=Task Boards')).toBeVisible();

    // 2. Create Project
    await page.click('button:has-text("New Board")');
    await page.fill('input[name="name"]', projectName);
    await page.fill('textarea[name="description"]', 'E2E Testing Project');
    await page.click('button:has-text("Create")');

    // Verify creation
    await expect(page.locator(`text=${projectName}`).first()).toBeVisible({ timeout: 15000 });

    // 3. Open Board
    await page.click(`text=${projectName}`);
    await expect(page).toHaveURL(/.*\/tasks\/.*/, { timeout: 15000 });

    // 4. Create Column
    await page.click('button:has-text("Add Column")');
    await page.fill('input[placeholder="Column title..."]', columnName);
    await page.click('button:has-text("Save")');
    await expect(page.locator(`text=${columnName}`)).toBeVisible({ timeout: 15000 });

    // 5. Create Task
    await page.click('button:has-text("Add Task")');
    await page.fill('textarea[placeholder="Task title..."]', taskName);
    await page.click('button:has-text("Add")');
    await expect(page.locator(`text=${taskName}`)).toBeVisible({ timeout: 15000 });

    // 6. Open Task Modal and Edit
    await page.click(`text=${taskName}`);
    await expect(page.getByRole('heading', { name: 'Assignment' })).toBeVisible({ timeout: 15000 });
    
    // Add comment
    await page.fill('textarea[placeholder="Write a comment..."]', 'This is an E2E test comment');
    await page.click('button:has-text("Save Comment")');
    await expect(page.locator('text=This is an E2E test comment')).toBeVisible({ timeout: 15000 });

    // Close Modal
    await page.locator('button').filter({ hasText: '' }).first().click(); // click X button or overlay (clicking overlay is trickier, let's just press Escape)
    await page.keyboard.press('Escape');
    
    // Wait for modal to close (modal contains 'Assignment' text)
    await expect(page.getByRole('heading', { name: 'Assignment' })).not.toBeVisible();
  });
});

test.describe('Tasks Board RBAC', () => {
  test('Investor cannot access tasks board', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test.investor@example.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 15000 });

    await page.goto('/tasks');
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 15000 });
  });
});
