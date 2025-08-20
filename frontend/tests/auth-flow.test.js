// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Authentication Flow', () => {
  test('should login with mock Google OAuth and navigate to profile', async ({ page }) => {
    // Start at the login page
    await page.goto('http://localhost:3000/login');
    
    // Wait for the login page to load
    await page.waitForSelector('.new-login-container');
    
    // Click the Google login button
    const googleButton = page.locator('button:has-text("Google")').first();
    await googleButton.click();
    
    // We should be automatically redirected to the main app
    await page.waitForURL('http://localhost:3000/');
    
    // Navigate to the profile page
    await page.goto('http://localhost:3000/profile');
    
    // Wait for the profile page to load
    await page.waitForSelector('.user-profile-container');
    
    // Check that the user is logged in with Google
    const providerText = await page.locator('.user-profile-provider span').textContent();
    expect(providerText).toContain('google');
    
    // Test the logout button
    const logoutButton = page.locator('button:has-text("התנתקות מהמערכת")');
    await logoutButton.click();
    
    // We should be redirected back to the login page
    await page.waitForURL('http://localhost:3000/login');
  });
});