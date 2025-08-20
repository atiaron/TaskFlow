import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import App from '../App';

expect.extend(toHaveNoViolations);

async function a11y(container, opts) {
  const results = await axe(container, opts);
  expect(results).toHaveNoViolations();
}

describe('App accessibility baseline', () => {
  beforeEach(() => { localStorage.clear(); });

  test('initial render has no basic a11y violations', async () => {
    const { container } = render(<App />);
    await a11y(container);
  });

  test('after adding a task still no violations', async () => {
    const { container } = render(<App />);
    // Add a task via empty state CTA
    const add = screen.getByRole('button', { name: /הוספת משימה חדשה|הוסף משימה/ });
    userEvent.click(add);
    const input = screen.getByRole('textbox', { name: /עריכת כותרת משימה|משימה חדשה/ });
    userEvent.type(input, 'Accessibility check{enter}');
    await a11y(container);
  });
});
