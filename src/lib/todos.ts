export const COLORS = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'] as const;
export type TodoColor = (typeof COLORS)[number];

export interface Todo {
  id: string;
  text: string;
  color?: TodoColor;
  createdAt: number;
  completedAt?: number;
}

export interface AppData {
  version: 1;
  /** Open tasks in the order shown on screen. */
  todos: Todo[];
  /** Completed tasks, newest first. */
  history: Todo[];
}

export const HISTORY_LIMIT = 2000;
export const emptyData = (): AppData => ({ version: 1, todos: [], history: [] });

export function newId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function addTodo(data: AppData, text: string, now = Date.now(), color?: TodoColor): AppData {
  const clean = text.trim();
  if (!clean) return data;
  const todo: Todo = { id: newId(), text: clean, createdAt: now, ...(color ? { color } : {}) };
  return { ...data, todos: [...data.todos, todo] };
}

export function editTodo(data: AppData, id: string, patch: { text?: string; color?: TodoColor | null }): AppData {
  return {
    ...data,
    todos: data.todos.map(todo => {
      if (todo.id !== id) return todo;
      const next: Todo = { ...todo };
      if (patch.text !== undefined && patch.text.trim()) next.text = patch.text.trim();
      if (patch.color === null) delete next.color;
      else if (patch.color) next.color = patch.color;
      return next;
    }),
  };
}

export function completeTodo(data: AppData, id: string, now = Date.now()): AppData {
  const target = data.todos.find(todo => todo.id === id);
  if (!target) return data;
  const done: Todo = { ...target, completedAt: now };
  return {
    ...data,
    todos: data.todos.filter(todo => todo.id !== id),
    history: [done, ...data.history].slice(0, HISTORY_LIMIT),
  };
}

/** Puts a completed task back on the list at `index` (default: the end). */
export function restoreTodo(data: AppData, id: string, index = data.todos.length): AppData {
  const target = data.history.find(todo => todo.id === id);
  if (!target) return data;
  const { completedAt: _completedAt, ...open } = target;
  const todos = [...data.todos];
  todos.splice(Math.max(0, Math.min(index, todos.length)), 0, open);
  return { ...data, todos, history: data.history.filter(todo => todo.id !== id) };
}

export function deleteTodo(data: AppData, id: string): AppData {
  return { ...data, todos: data.todos.filter(todo => todo.id !== id) };
}

export function deleteHistoryItem(data: AppData, id: string): AppData {
  return { ...data, history: data.history.filter(todo => todo.id !== id) };
}

export function clearHistory(data: AppData): AppData {
  return { ...data, history: [] };
}

export function moveTodo(data: AppData, fromId: string, toId: string): AppData {
  const from = data.todos.findIndex(todo => todo.id === fromId);
  const to = data.todos.findIndex(todo => todo.id === toId);
  if (from < 0 || to < 0 || from === to) return data;
  const todos = [...data.todos];
  const [moved] = todos.splice(from, 1);
  todos.splice(to, 0, moved);
  return { ...data, todos };
}

function parseTodo(value: unknown): Todo | null {
  if (!value || typeof value !== 'object') return null;
  const input = value as Record<string, unknown>;
  if (typeof input.id !== 'string' || !input.id || typeof input.text !== 'string' || !input.text.trim()) return null;
  const createdAt = Number(input.createdAt);
  const todo: Todo = {
    id: input.id,
    text: input.text.slice(0, 500),
    createdAt: Number.isFinite(createdAt) ? createdAt : Date.now(),
  };
  if (COLORS.includes(input.color as TodoColor)) todo.color = input.color as TodoColor;
  const completedAt = Number(input.completedAt);
  if (input.completedAt !== undefined && Number.isFinite(completedAt)) todo.completedAt = completedAt;
  return todo;
}

/** Accepts anything (stored JSON, a pasted backup) and returns valid data, or null when it is not ours. */
export function parseAppData(value: unknown): AppData | null {
  if (!value || typeof value !== 'object') return null;
  const input = value as Record<string, unknown>;
  if (!Array.isArray(input.todos) || !Array.isArray(input.history)) return null;
  const seen = new Set<string>();
  const keep = (list: unknown[]) =>
    list.flatMap(item => {
      const todo = parseTodo(item);
      if (!todo || seen.has(todo.id)) return [];
      seen.add(todo.id);
      return [todo];
    });
  const todos = keep(input.todos).map(({ completedAt: _c, ...open }) => open);
  const history = keep(input.history)
    .map(todo => ({ ...todo, completedAt: todo.completedAt ?? todo.createdAt }))
    .slice(0, HISTORY_LIMIT);
  return { version: 1, todos, history };
}

/** Groups history (already newest first) by local calendar day. */
export function groupByDay(items: Todo[]): { day: string; items: Todo[] }[] {
  const groups: { day: string; items: Todo[] }[] = [];
  for (const item of items) {
    const date = new Date(item.completedAt ?? item.createdAt);
    const day = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.items.push(item);
    else groups.push({ day, items: [item] });
  }
  return groups;
}
