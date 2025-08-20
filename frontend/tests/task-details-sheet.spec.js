// E2E placeholder test for TaskDetailsSheet interaction
// Ensures a task details dialog opens with proper aria attributes and closes correctly.

import { test, expect } from '@playwright/test';

test.describe('Task Details Sheet', () => {
  test('opens and closes from task title click', async ({ page }) => {
    await page.goto('http://localhost:3000/');

    // Assume at least one task exists; pick first active task button by name pattern
    const firstTaskButton = page.getByRole('button', { name: /פתח פרטי משימה:/ });
    await expect(firstTaskButton.first()).toBeVisible();
    await firstTaskButton.first().click();

    // Dialog should appear
    const dialog = page.getByRole('dialog', { name: 'פרטי משימה' });
    await expect(dialog).toBeVisible();

    // Close via close button
    await page.getByRole('button', { name: 'סגור' }).click();
    await expect(dialog).not.toBeVisible();
  });
});
