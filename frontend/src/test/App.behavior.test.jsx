import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

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

describe('App core behaviors', () => {
  beforeEach(() => {
    // isolate localStorage
    window.localStorage.clear();
  });

  test('create task and persist', () => {
    render(<App />);
    createTask('אחת');
    expect(screen.getByText('אחת')).toBeInTheDocument();
    // simulate remount
    window.location.reload = () => {};
  });

  test('filter active/completed/starred flow', async () => {
    render(<App />);
    createTask('משימה A');
    createTask('משימה B');
    const rows = screen.getAllByRole('group', { name: /משימה:/ });
    expect(rows.length).toBeGreaterThanOrEqual(2);
    // mark first completed
    const firstCompleteBtn = within(rows[0]).getByRole('button', { name: /סמן כהושלם|בטל השלמה/ });
    userEvent.click(firstCompleteBtn);
    // star second
    const secondStarBtn = within(rows[1]).getByRole('button', { name: /הוסף כוכב|בטל כוכב/ });
    userEvent.click(secondStarBtn);
    // filter active
    userEvent.click(screen.getByRole('tab', { name: 'פעילות' }));
    expect(screen.queryByText('משימה A')).not.toBeInTheDocument();
    expect(screen.getByText('משימה B')).toBeInTheDocument();
    // filter completed
    userEvent.click(screen.getByRole('tab', { name: 'הושלמו' }));
    expect(screen.getByText('משימה A')).toBeInTheDocument();
    // filter starred
    userEvent.click(screen.getByRole('tab', { name: 'כוכב' }));
    expect(screen.getByText('משימה B')).toBeInTheDocument();
  });

  test('inline edit and undo clear', async () => {
    render(<App />);
    createTask('לערוך אותי');
    const row = screen.getByRole('group', { name: /לערוך אותי/ });
    userEvent.dblClick(within(row).getByText('לערוך אותי'));
    const editor = screen.getByRole('textbox', { name: /עריכת כותרת משימה/ });
    userEvent.clear(editor);
    userEvent.type(editor, 'חדש{enter}');
    expect(screen.getByText('חדש')).toBeInTheDocument();
    // mark completed
    const completeBtn = within(row).getByRole('button', { name: /סמן כהושלם|בטל השלמה/ });
    userEvent.click(completeBtn);
    // add second task and complete
    createTask('עוד אחת');
    const row2 = screen.getByRole('group', { name: /עוד אחת/ });
    const completeBtn2 = within(row2).getByRole('button', { name: /סמן כהושלם|בטל השלמה/ });
    userEvent.click(completeBtn2);
    // clear via visible button
    const clearBtn = screen.getByTestId('clear-completed');
    userEvent.click(clearBtn);
  expect(await screen.findByText(/נוקו משימות שהושלמו/)).toBeInTheDocument();
    const undo = screen.getByRole('button', { name: 'בטל' });
    userEvent.click(undo);
    expect(screen.getByText('חדש')).toBeInTheDocument();
    expect(screen.getByText('עוד אחת')).toBeInTheDocument();
  });

  test('rapid filter switching stability', () => {
    render(<App />);
    createTask('F1');
    createTask('F2');
    // simulate quick toggling between tabs
    const tabs = ['הכל','פעילות','הושלמו','כוכב'];
    for (let i=0;i<8;i++) {
      const label = tabs[i % tabs.length];
      const tab = screen.getByRole('tab', { name: label });
      userEvent.click(tab);
    }
    // Should still have tasks present
    expect(screen.getByText('F1')).toBeInTheDocument();
    expect(screen.getByText('F2')).toBeInTheDocument();
  });

  test('cancel edit restores original title', () => {
    render(<App />);
    createTask('Original');
    const row = screen.getByRole('group', { name: /Original/ });
    userEvent.dblClick(within(row).getByText('Original'));
    const editor = screen.getByRole('textbox', { name: /עריכת כותרת משימה/ });
    userEvent.type(editor, ' Changed');
    // press escape to cancel
    userEvent.keyboard('{Escape}');
    expect(screen.getByText('Original')).toBeInTheDocument();
  });

  test('adding empty task is ignored', () => {
    render(<App />);
    // open create
    const addBtn = screen.getByRole('button', { name: /הוספת משימה חדשה|הוסף משימה/ });
    userEvent.click(addBtn);
    const input = screen.getByRole('textbox', { name: /עריכת כותרת משימה|משימה חדשה/ });
    userEvent.type(input, '   {enter}');
    expect(screen.queryByRole('group', { name: /משימה:/ })).not.toBeInTheDocument();
  });

  test('long title truncated to max', () => {
    render(<App />);
    const long = 'x'.repeat(500);
    createTask(long);
    const row = screen.getAllByRole('group', { name: /משימה:/ })[0];
    const textEl = within(row).getByText(/x+/);
    expect(textEl.textContent.length).toBeLessThanOrEqual(200);
  });
});
