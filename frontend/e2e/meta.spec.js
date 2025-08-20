// meta.spec.js - Playwright test for structured task meta
// NOTE: Assumes dev server running or will be run via test:e2e script env.
import { test, expect } from '@playwright/test';

// Utility: check no colon text in badge
async function assertNoColon(badge) {
  const txt = (await badge.innerText()).trim();
  expect(txt.includes(':')).toBeFalsy();
}

// Minimal smoke: navigate root and assert meta rendering semantics
// Adjust selector strategy if app routes differ.

test.describe('Task Meta Rendering & Structure', () => {
  test('structure: rail/body/trailing + meta integrity (no urgency)', async ({ page }) => {
    await page.goto('/');
    // Heuristic: select first task row
    const firstRow = page.locator('.gt-row').first();
    await expect(firstRow).toBeVisible();

    // Structural children
    await expect(firstRow.locator('> .gt-rail')).toHaveCount(1);
    await expect(firstRow.locator('> .gt-body')).toHaveCount(1);
    await expect(firstRow.locator('> .gt-trailing')).toHaveCount(1);

  // Rail contents: only check button now
  const rail = firstRow.locator('> .gt-rail');
  await expect(rail.locator('.gt-check')).toHaveCount(1);
  await expect(rail.locator('.gt-urgency')).toHaveCount(0);

    // Should NOT have legacy .gt-subtitle inside row
    await expect(firstRow.locator('.gt-subtitle')).toHaveCount(0);

    // Should have either .gt-meta or data-role="task-meta"
    const meta = firstRow.locator('.gt-meta');
    await expect(meta).toBeVisible();

    const badge = meta.locator('.gt-badge').first();
    if (await badge.count()) {
      await expect(badge).toBeVisible();
      // Icon svg inside
      const svg = badge.locator('svg');
      await expect(svg).toHaveCount(1);
      await assertNoColon(badge);
      // Variant class applied
      const classes = await badge.getAttribute('class');
      expect(classes).toMatch(/is-variant--(success|warning|danger|info|muted|neutral)/);
    }

    // Time cluster existence (if any meta kind or date/time)
    const timeCluster = meta.locator('.gt-timeCluster');
    await expect(timeCluster).toHaveCount(1);
    // Chips (datetime or relative) may or may not exist; just ensure no crash
    // If datetime chip exists, it should have class gt-chip--datetime
    const datetimeChip = meta.locator('.gt-chip--datetime').first();
    if (await datetimeChip.count()) {
      await expect(datetimeChip).toBeVisible();
      const chipClass = await datetimeChip.getAttribute('class');
      expect(chipClass).toMatch(/is-variant--(success|warning|danger|info|muted|neutral)/);
    }

    // Ensure no dangerouslySetInnerHTML attribute appears in meta subtree (heuristic)
    const dangerouslyNodes = meta.locator('[dangerouslySetInnerHTML]');
    await expect(dangerouslyNodes).toHaveCount(0);

    // Accessible name pattern on row (Hebrew phrase parts)
    const accName = await firstRow.getAttribute('aria-label');
  // Priority phrase optional: ", עדיפות: גבוהה|בינונית|נמוכה"
  expect(accName).toMatch(/^משימה: .+, מצב: (הושלמה|פעילה)(, עדיפות: (גבוהה|בינונית|נמוכה))?, (תזכורת .+|ללא תזכורת)$/);

    // No aria-describedby clutter on row
    const ariaDescribedBy = await firstRow.getAttribute('aria-describedby');
    expect(ariaDescribedBy).toBeFalsy();

  // Completed toggle still works; no urgency opacity check
    const isCompleted = await firstRow.getAttribute('data-state') === 'completed';
    if (!isCompleted) {
      // toggle complete
      await rail.locator('.gt-check').click();
      await expect(firstRow).toHaveAttribute('data-state', 'completed');
      // revert state for idempotency
      await rail.locator('.gt-check').click();
      await expect(firstRow).toHaveAttribute('data-state', 'active');
    }

    // If priority badge exists ensure it's the first badge (order integrity)
    const badges = meta.locator('.gt-badge');
    const count = await badges.count();
    if (count > 0) {
      for (let i=0;i<count;i++) {
        const cls = await badges.nth(i).getAttribute('class');
        if (cls.includes('gt-badge--priority')) {
          // priority should be index 0
          expect(i).toBe(0);
          break;
        }
      }
    }
  });
});
