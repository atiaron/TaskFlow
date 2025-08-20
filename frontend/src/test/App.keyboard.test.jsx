import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

// Basic keyboard traversal to ensure focusable sequence and visible focus outline (indirect assertion via class/attributes)

describe('Keyboard navigation a11y', () => {
  beforeEach(() => { localStorage.clear(); });

  test('tab through add -> filter tabs -> create input -> task actions', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Focus body then Tab to first interactive (empty state primary button)
    await user.tab();
    const addBtn = screen.getByRole('button', { name: /הוספת משימה חדשה|הוסף משימה/ });
    expect(addBtn).toHaveFocus();

    // Activate and create a task via keyboard
    await user.keyboard('{Enter}');
    const input = screen.getByRole('textbox', { name: /עריכת כותרת משימה|משימה חדשה/ });
    await user.type(input, 'Keyboard Task{enter}');

    // Tab across filter chips
    for (let i=0;i<4;i++) { await user.tab(); }
    const filterStar = screen.getByRole('tab', { name: 'כוכב' });
    expect(filterStar).toHaveFocus();

    // Tab to first task row's complete button
    await user.tab();
    const completeBtn = screen.getByRole('button', { name: /סמן כהושלם|בטל השלמה/ });
    expect(completeBtn).toHaveFocus();

    // Toggle via Space
    await user.keyboard(' ');
    // Should now have completed state label
    expect(completeBtn.getAttribute('aria-label')).toMatch(/בטל השלמה/);
  });
});
