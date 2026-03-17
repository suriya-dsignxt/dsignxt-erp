import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
    test('should login and redirect to dashboard', async ({ page }) => {
        // Go to login page
        await page.goto('/login');

        // Fill in credentials for the seeded test admin
        await page.locator('input[type="email"]').fill('test_admin@dsignxt.com');
        await page.locator('input[type="password"]').fill('TestAdmin123!');

        // Click login button
        await page.click('button[type="submit"]');

        // Wait for navigation and verify URL
        await page.waitForURL(/.*admin/);
        await expect(page).toHaveURL(/.*admin/);

        // Check for dashboard indicator
        const dashboardHeading = page.locator('h1, h2').filter({ hasText: 'Dashboard' }).first();
        await expect(dashboardHeading).toBeVisible({ timeout: 10000 });
    });

    test('should show error for invalid credentials', async ({ page }) => {
        await page.goto('/login');
        await page.locator('input[type="email"]').fill('wrong@example.com');
        await page.locator('input[type="password"]').fill('wrongpass');
        await page.click('button[type="submit"]');

        // Check for error toast or message
        await expect(page.locator('text=Invalid credentials')).toBeVisible();
    });
});
