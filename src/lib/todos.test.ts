import { describe, expect, it } from 'vitest';
import {
  addTodo, clearHistory, completeTodo, deleteHistoryItem, deleteTodo, editTodo, emptyData,
  groupByDay, insertTodo, moveTodo, parseAppData, restoreTodo, sortTodos,
} from './todos';

function withTodos(...texts: string[]) {
  return texts.reduceRight((data, text, i) => addTodo(data, text, 1000 + i), emptyData());
}

describe('todos', () => {
  it('adds trimmed text at the top and ignores blanks', () => {
    const data = addTodo(withTodos('a'), '  b  ', 5);
    expect(data.todos.map(t => t.text)).toEqual(['b', 'a']);
    expect(addTodo(data, '   ')).toBe(data);
  });

  it('sorts scheduled tasks by proximity to now, then keeps the manual order of unscheduled tasks', () => {
    let data = withTodos('older', 'oldest');
    data = addTodo(data, 'far future', 1, undefined, 8000);
    data = addTodo(data, 'near future', 2, 'blue', 5200);
    data = addTodo(data, 'near past', 3, undefined, 4900);
    data = addTodo(data, 'newest', 4);
    const original = [...data.todos];
    expect(sortTodos(data.todos, 5000).map(t => t.text)).toEqual(['near past', 'near future', 'far future', 'newest', 'older', 'oldest']);
    expect(sortTodos(data.todos, 5300).map(t => t.text).slice(0, 2)).toEqual(['near future', 'near past']);
    expect(data.todos).toEqual(original);
    expect(sortTodos(moveTodo(data, data.todos[4].id, data.todos[5].id).todos, 5000).map(t => t.text).slice(-3)).toEqual(['newest', 'oldest', 'older']);
  });

  it('preserves a schedule through completion, restore and backup parsing, and lets it be removed', () => {
    let data = addTodo(withTodos('old task'), 'scheduled', 100, 'red', 5000);
    const id = data.todos[0].id;
    data = editTodo(data, id, { dueAt: 6000 });
    data = completeTodo(data, id, 7000);
    expect(data.history[0]).toMatchObject({ id, dueAt: 6000, completedAt: 7000 });
    data = parseAppData(JSON.parse(JSON.stringify(data)))!;
    data = restoreTodo(data, id);
    expect(data.todos.find(t => t.id === id)).toMatchObject({ dueAt: 6000 });
    data = editTodo(data, id, { dueAt: null });
    expect(data.todos.find(t => t.id === id)?.dueAt).toBeUndefined();
  });

  it('keeps old backups readable and ignores invalid schedules without dropping tasks', () => {
    const values = [undefined, null, 'tomorrow', Infinity, NaN, 1e20, 5000];
    const parsed = parseAppData({ todos: values.map((dueAt, i) => ({ id: String(i), text: 'task', createdAt: 1, dueAt })), history: [] })!;
    expect(parsed.todos).toHaveLength(7);
    expect(parsed.todos.map(t => t.dueAt)).toEqual([undefined, undefined, undefined, undefined, undefined, undefined, 5000]);
    expect(addTodo(emptyData(), 'task', 1, undefined, NaN).todos[0].dueAt).toBeUndefined();
  });

  it('preserves saved order when scheduled times are equally close', () => {
    const data = addTodo(addTodo(emptyData(), 'future', 1, undefined, 6000), 'past', 2, undefined, 4000);
    expect(sortTodos(data.todos, 5000).map(t => t.text)).toEqual(['past', 'future']);
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

  it('undoes a delete by inserting the task back at its old position', () => {
    const data = withTodos('a', 'b', 'c');
    const removed = data.todos[1];
    const deleted = deleteTodo(data, removed.id);
    expect(insertTodo(deleted, removed, 1).todos.map(t => t.text)).toEqual(['a', 'b', 'c']);
    expect(insertTodo(deleted, removed, 99).todos.map(t => t.text)).toEqual(['a', 'c', 'b']);
    const restored = insertTodo(deleted, removed, 1);
    expect(insertTodo(restored, removed, 0)).toBe(restored);
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
