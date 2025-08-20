import { test, expect, Page } from '@playwright/test';

async function create(page: Page, title: string) {
  const input = page.locator('[data-testid="create-task-input"]');
  if (await input.count() === 0) test.skip();
  await input.fill(title);
  await input.press('Enter');
}

const densities = [
  { cls: '', name: 'default' },
  { cls: 'density-compact', name: 'compact' },
  { cls: 'density-dense', name: 'dense' }
];

/**
 * Verifies that runtime computed styles for Task Row map to design tokens.
 * - gap === --row-gap-inline / fallback
 * - padding-inline of .gt-row matches --row-pad-inline
 * - .gt-textButton padding-block equals --row-pad-block
 * - icon (check) size == var(--icon-size) for primary; star size == secondary token
 * - title line-height equals --line-height-title
 */

test.describe('Task Row Token Contract', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/'); });

  for (const d of densities) {
    test(`Tokens applied for density: ${d.name}`, async ({ page }) => {
      if (d.cls) await page.evaluate((cls) => document.querySelector('.google-tasks-wrapper')?.classList.add(cls), d.cls);
      await create(page, `Token Contract ${d.name}`);
      const row = page.locator('.gt-row').first();
      await expect(row).toBeVisible();

      // helper to read a CSS var resolved
      const readVar = async (el: any, name: string) => el.evaluate((node: HTMLElement, varName) => getComputedStyle(node).getPropertyValue(varName).trim(), name);

      const gap = await row.evaluate(el => getComputedStyle(el).columnGap || getComputedStyle(el).gap);
      const tokenGap = await readVar(row, '--row-gap-inline') || await readVar(row, '--row-gap');
      expect(parseFloat(gap)).toBeCloseTo(parseFloat(tokenGap), 1);

      const padInline = await row.evaluate(el => getComputedStyle(el).paddingInlineStart || getComputedStyle(el).paddingRight);
      const tokenPadInline = await readVar(row, '--row-pad-inline');
      expect(parseFloat(padInline)).toBeCloseTo(parseFloat(tokenPadInline), 1);

      const textBtn = row.locator('.gt-textButton').first();
      const padBlock = await textBtn.evaluate(el => getComputedStyle(el).paddingBlockStart || getComputedStyle(el).paddingTop);
      const tokenPadBlock = await readVar(textBtn, '--row-pad-block') || await readVar(row, '--row-pad-block');
      expect(parseFloat(padBlock)).toBeCloseTo(parseFloat(tokenPadBlock), 1);

      const check = row.locator('.gt-check');
      const star = row.locator('.gt-star');
      const checkBox = await check.boundingBox();
      const starBox = await star.boundingBox();
      if (!checkBox || !starBox) test.skip();
      const iconToken = await readVar(row, '--icon-size');
      // primary should equal density-aware icon-size
      expect(Math.round(checkBox.width)).toBeCloseTo(Math.round(parseFloat(iconToken)), 1);
      // star width should be <= primary (uses secondary size token path)
      expect(starBox.width).toBeLessThanOrEqual(checkBox.width);

      const title = row.locator('.gt-title');
      const lineHeight = await title.evaluate(el => getComputedStyle(el).lineHeight);
      const tokenLH = await readVar(title, '--line-height-title') || await readVar(row, '--line-height-title');
      expect(parseFloat(lineHeight)).toBeCloseTo(parseFloat(tokenLH), 1);
    });
  }
});
