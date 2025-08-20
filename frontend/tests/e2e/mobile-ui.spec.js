// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Mobile UI Test Suite
 * Tests mobile-specific UI optimizations across various devices
 */
test.describe('Mobile UI optimizations', () => {
  // Test on different device viewports
  const devices = [
    { name: 'iPhone SE', width: 375, height: 667 },
    { name: 'iPhone 12', width: 390, height: 844 },
    { name: 'Pixel 5', width: 393, height: 851 },
    { name: 'Samsung Galaxy S20', width: 360, height: 800 },
    { name: 'iPad Mini', width: 768, height: 1024 },
  ];

  for (const device of devices) {
    test(`should render correctly on ${device.name}`, async ({ page }) => {
      // Set viewport to device dimensions
      await page.setViewportSize({
        width: device.width,
        height: device.height,
      });

      // Navigate to the app
      await page.goto('/');

      // Check that the mobile navigation bar is visible
      const mobileNav = page.locator('.mobile-bottom-bar-enhanced');
      await expect(mobileNav).toBeVisible();

      // Take a screenshot for visual comparison
      await page.screenshot({ 
        path: `./test-results/${device.name.toLowerCase().replace(/\s+/g, '-')}-viewport.png`,
        fullPage: true 
      });
    });

    test(`should have proper touch target sizes on ${device.name}`, async ({ page }) => {
      // Set viewport to device dimensions
      await page.setViewportSize({
        width: device.width,
        height: device.height,
      });

      await page.goto('/');

      // Check bottom navigation items have adequate touch target size
      const navItems = page.locator('.mobile-bottom-bar-item-enhanced');
      
      for (let i = 0; i < await navItems.count(); i++) {
        const item = navItems.nth(i);
        const box = await item.boundingBox();
        
        // Ensure minimum touch target size of 44x44 pixels per WCAG guidelines
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    });

    test(`should have readable text on ${device.name}`, async ({ page }) => {
      // Set viewport to device dimensions
      await page.setViewportSize({
        width: device.width,
        height: device.height,
      });

      await page.goto('/');

      // Get all text elements that should be readable
      const textElements = page.locator('h1, h2, h3, p, button, .text-body, .text-body-sm');
      
      // Ensure fonts are not too small on mobile
      for (let i = 0; i < await textElements.count(); i++) {
        const element = textElements.nth(i);
        const fontSize = await element.evaluate(el => {
          return parseFloat(window.getComputedStyle(el).fontSize);
        });
        
        // Ensure minimum font size of 12px for readability
        expect(fontSize).toBeGreaterThanOrEqual(12);
      }
    });
  }

  test('should show mobile sidebar when menu button is clicked', async ({ page }) => {
    await page.setViewportSize({
      width: 375,
      height: 667, // iPhone SE size
    });

    await page.goto('/');

    // Find and click the menu button
    await page.locator('button[aria-label="פתח תפריט"]').click();
    
    // Check that the sidebar becomes visible
    const sidebar = page.locator('.mobile-sidebar-enhanced');
    await expect(sidebar).toBeVisible();
    
    // Take a screenshot with the sidebar open
    await page.screenshot({ 
      path: './test-results/mobile-sidebar-open.png'
    });
  });

  test('should have proper fixed header on scroll', async ({ page }) => {
    await page.setViewportSize({
      width: 375,
      height: 667,
    });

    await page.goto('/');

    // Get header element
    const header = page.locator('header');
    
    // Get initial position
    const initialPosition = await header.boundingBox();
    
    // Scroll down
    await page.evaluate(() => {
      window.scrollBy(0, 200);
    });
    
    // Wait for any animations
    await page.waitForTimeout(500);
    
    // Get new position
    const scrolledPosition = await header.boundingBox();
    
    // Header should stay fixed at the top
    expect(scrolledPosition.y).toEqual(initialPosition.y);
  });

  test('should render task cards properly on mobile', async ({ page }) => {
    await page.setViewportSize({
      width: 375,
      height: 667,
    });

    await page.goto('/');

    // Check if task cards are rendered
    const taskCards = page.locator('.task-card-glass');
    
    // Ensure there are task cards rendered
    expect(await taskCards.count()).toBeGreaterThan(0);
    
    // Check that cards have proper width (nearly full width on mobile)
    for (let i = 0; i < Math.min(await taskCards.count(), 3); i++) {
      const card = taskCards.nth(i);
      const box = await card.boundingBox();
      
      // Card should be nearly the full viewport width on mobile
      expect(box.width).toBeGreaterThan(320);
    }
  });

  test('should handle device orientation change', async ({ page }) => {
    // Start with portrait orientation
    await page.setViewportSize({
      width: 375,
      height: 667,
    });

    await page.goto('/');
    
    // Take screenshot in portrait mode
    await page.screenshot({ 
      path: './test-results/portrait-orientation.png',
      fullPage: false
    });
    
    // Simulate landscape orientation
    await page.setViewportSize({
      width: 667,
      height: 375,
    });
    
    // Wait for any orientation change handling
    await page.waitForTimeout(500);
    
    // Take screenshot in landscape mode
    await page.screenshot({ 
      path: './test-results/landscape-orientation.png',
      fullPage: false
    });
    
    // Check that the bottom navigation is still visible
    const mobileNav = page.locator('.mobile-bottom-bar-enhanced');
    await expect(mobileNav).toBeVisible();
  });
});