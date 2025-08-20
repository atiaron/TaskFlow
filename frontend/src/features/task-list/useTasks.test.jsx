// Tests for useTasks hook
import { renderHook, act } from '@testing-library/react';
import { useTasks, TITLE_MAX } from './useTasks';

function addSampleTasks(result, titles) {
  titles.forEach(t => act(() => { result.current.addTask(t); }));
}

describe('useTasks', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('adds a task', () => {
    const { result } = renderHook(() => useTasks());
    act(() => { result.current.addTask('Hello'); });
    expect(result.current.tasks[0].title).toBe('Hello');
  });

  test('rejects empty/whitespace title', () => {
    const { result } = renderHook(() => useTasks());
    act(() => { result.current.addTask('   '); });
    expect(result.current.tasks.length).toBe(0);
  });

  test('trims and limits length', () => {
    const { result } = renderHook(() => useTasks());
    const long = 'x'.repeat(TITLE_MAX + 50);
    act(() => { result.current.addTask('  ' + long + '  '); });
    expect(result.current.tasks[0].title.length).toBe(TITLE_MAX);
  });

  test('toggle complete & star', () => {
    const { result } = renderHook(() => useTasks());
    act(() => { result.current.addTask('A'); });
    const id = result.current.tasks[0].id;
    act(() => { result.current.toggleComplete(id); });
    expect(result.current.tasks[0].completed).toBe(true);
    act(() => { result.current.toggleStar(id); });
    expect(result.current.tasks[0].starred).toBe(true);
  });

  test('update task title', () => {
    const { result } = renderHook(() => useTasks());
    act(() => { result.current.addTask('Title'); });
    const id = result.current.tasks[0].id;
    act(() => { result.current.updateTask(id, { title: 'New' }); });
    expect(result.current.tasks[0].title).toBe('New');
  });

  test('clear completed & undo', () => {
    const { result } = renderHook(() => useTasks());
    addSampleTasks(result, ['One','Two','Three']);
    const id = result.current.tasks[1].id; // 'Two'
    act(() => { result.current.toggleComplete(id); });
    act(() => { result.current.clearCompleted(); });
    expect(result.current.tasks.find(t => t.id === id)).toBeUndefined();
    expect(result.current.lastCleared.length).toBe(1);
    act(() => { result.current.undoClear(); });
    expect(result.current.tasks.find(t => t.id === id)).toBeDefined();
  });

  test('rapid operations stability', () => {
    const { result } = renderHook(() => useTasks());
    act(() => { for (let i=0;i<20;i++) result.current.addTask('T'+i); });
    // toggle first 5 complete
    act(() => { result.current.tasks.slice(0,5).forEach(t => result.current.toggleComplete(t.id)); });
    // clear and undo quickly
    act(() => { result.current.clearCompleted(); result.current.undoClear(); });
    expect(result.current.tasks.length).toBe(20);
  });
});
