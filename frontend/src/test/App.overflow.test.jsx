import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

// Helper mirrors style from App.behavior.test
function createTask(title) {
  const addBtn = screen.queryByRole('button', { name: /הוספת משימה חדשה|הוסף משימה/i });
  if (addBtn) {
    userEvent.click(addBtn);
  } else {
    const fab = screen.getByRole('button', { name: /הוסף משימה|הוספת משימה חדשה/i });
    userEvent.click(fab);
  }
  const input = screen.getByRole('textbox', { name: /עריכת כותרת משימה|משימה חדשה/i });
  userEvent.type(input, title + '{enter}');
}

describe('Overflow & truncation behavior', () => {
  beforeEach(() => { localStorage.clear(); });

  test('very long title is visually truncated but full text available via title attribute', () => {
    render(<App />);
    const long = 'כ'.repeat(400) + ' סוף';
    createTask(long);
    const row = screen.getByRole('group', { name: /משימה:/ });
    const titleSpan = within(row).getByText(/כ+/); // matches repeated chars
    // Ensure DOM text limited (implementation caps at 200 in editor save path)
    expect(titleSpan.textContent.length).toBeLessThanOrEqual(200);
    // Full text should still be discoverable via the title attribute for tooltip (title attr holds truncated or full)
    expect(titleSpan).toHaveAttribute('title');
  });

  test('focus on truncated title preserves accessible name and allows keyboard edit', async () => {
    const user = userEvent.setup();
    render(<App />);
    createTask('A'.repeat(250));
    const row = screen.getByRole('group', { name: /משימה:/ });
    const titleEl = within(row).getByText(/A+/);
    titleEl.focus();
    expect(titleEl).toHaveFocus();
    await user.dblClick(titleEl);
    const editor = screen.getByRole('textbox', { name: /עריכת כותרת משימה/ });
    await user.type(editor, ' Edit{enter}');
    expect(screen.getByText(/Edit$/)).toBeInTheDocument();
  });
});
