import { describe, expect, it } from 'vitest';
import {
  addTodo, clearHistory, completeTodo, deleteHistoryItem, deleteTodo, editTodo, emptyData,
  groupByDay, moveTodo, parseAppData, restoreTodo,
} from './todos';

function withTodos(...texts: string[]) {
  return texts.reduce((data, text, i) => addTodo(data, text, 1000 + i), emptyData());
}

describe('todos', () => {
  it('adds trimmed text at the end and ignores blanks', () => {
    const data = addTodo(withTodos('a'), '  b  ', 5);
    expect(data.todos.map(t => t.text)).toEqual(['a', 'b']);
    expect(addTodo(data, '   ')).toBe(data);
  });

  it('completes a task into history, newest first', () => {
    let data = withTodos('a', 'b', 'c');
    data = completeTodo(data, data.todos[0].id, 10);
    data = completeTodo(data, data.todos[0].id, 20);
    expect(data.todos.map(t => t.text)).toEqual(['c']);
    expect(data.history.map(t => t.text)).toEqual(['b', 'a']);
    expect(data.history[0].completedAt).toBe(20);
  });

  it('restores a completed task without its completion time', () => {
    let data = withTodos('a', 'b');
    const id = data.todos[0].id;
    data = completeTodo(data, id, 10);
    data = restoreTodo(data, id);
    expect(data.todos.map(t => t.text)).toEqual(['b', 'a']);
    expect(data.todos[1].completedAt).toBeUndefined();
    expect(data.history).toHaveLength(0);
  });

  it('reorders by moving one task onto another', () => {
    const data = withTodos('a', 'b', 'c');
    const [a, , c] = data.todos;
    expect(moveTodo(data, a.id, c.id).todos.map(t => t.text)).toEqual(['b', 'c', 'a']);
    expect(moveTodo(data, c.id, a.id).todos.map(t => t.text)).toEqual(['c', 'a', 'b']);
    expect(moveTodo(data, a.id, a.id)).toBe(data);
  });

  it('edits text and color, and keeps the old text when the new one is blank', () => {
    let data = withTodos('a');
    const id = data.todos[0].id;
    data = editTodo(data, id, { text: ' z ', color: 'red' });
    expect(data.todos[0]).toMatchObject({ text: 'z', color: 'red' });
    data = editTodo(data, id, { text: '  ', color: null });
    expect(data.todos[0].text).toBe('z');
    expect(data.todos[0].color).toBeUndefined();
  });

  it('deletes tasks and history entries', () => {
    let data = withTodos('a', 'b');
    data = completeTodo(data, data.todos[0].id);
    expect(deleteTodo(data, data.todos[0].id).todos).toHaveLength(0);
    expect(deleteHistoryItem(data, data.history[0].id).history).toHaveLength(0);
    expect(clearHistory(data).history).toHaveLength(0);
  });

  it('parses backups defensively', () => {
    expect(parseAppData(null)).toBeNull();
    expect(parseAppData({ todos: 1, history: [] })).toBeNull();
    const parsed = parseAppData({
      todos: [{ id: '1', text: 'x', createdAt: 1, color: 'nope' }, { id: '1', text: 'dup' }, { id: '', text: 'bad' }],
      history: [{ id: '2', text: 'y', createdAt: 1 }],
    });
    expect(parsed?.todos).toEqual([{ id: '1', text: 'x', createdAt: 1 }]);
    expect(parsed?.history[0].completedAt).toBe(1);
  });

  it('groups history by local day', () => {
    const day1 = new Date(2026, 0, 2, 9).getTime();
    const day2 = new Date(2026, 0, 1, 23).getTime();
    const groups = groupByDay([
      { id: 'a', text: 'a', createdAt: 0, completedAt: day1 },
      { id: 'b', text: 'b', createdAt: 0, completedAt: day1 + 1000 },
      { id: 'c', text: 'c', createdAt: 0, completedAt: day2 },
    ]);
    expect(groups.map(g => [g.day, g.items.length])).toEqual([['2026-01-02', 2], ['2026-01-01', 1]]);
  });
});
