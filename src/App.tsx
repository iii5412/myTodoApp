import { App as CapacitorApp } from '@capacitor/app';
import { CheckCheck, Plus, Settings } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AddBar } from './components/AddBar';
import { DeleteConfirmDialog } from './components/DeleteConfirmDialog';
import { EditSheet } from './components/EditSheet';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';
import { Toast } from './components/Toast';
import { TodoList } from './components/TodoList';
import { startOfToday } from './lib/format';
import { isNativeAndroid } from './lib/platform';
import { loadData, saveData } from './lib/storage';
import {
  addTodo, clearHistory, completeTodo, deleteHistoryItem, deleteTodo, editTodo, insertTodo, moveTodo, restoreTodo, sortTodos,
  type AppData, type TodoColor,
} from './lib/todos';

type View = 'home' | 'settings' | 'history';
type PendingDelete = { kind: 'todo' | 'history'; id: string; text: string } | { kind: 'history-all'; count: number };
interface ToastState {
  message: string;
  undo?: () => void;
}

const COMPLETE_ANIMATION_MS = 260;

export default function App() {
  const [data, setData] = useState<AppData>(loadData);
  const [view, setView] = useState<View>('home');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [today, setToday] = useState(() => new Date());
  const footerRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    saveData(data);
  }, [data]);

  useEffect(() => {
    const timer = window.setInterval(() => setToday(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const visibleTodos = useMemo(() => sortTodos(data.todos, today.getTime()), [data.todos, today]);

  // Let the toast float just above the footer, whatever its height (bottom inset).
  useLayoutEffect(() => {
    const footer = footerRef.current;
    const root = rootRef.current;
    if (!footer || !root || view !== 'home') return;
    const update = () => root.style.setProperty('--footer-h', `${footer.offsetHeight}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(footer);
    return () => observer.disconnect();
  }, [view]);

  // Android back button and the unlock launch both land here.
  const stateRef = useRef({ view, editingId, pendingDelete, adding });
  stateRef.current = { view, editingId, pendingDelete, adding };
  useEffect(() => {
    const goHome = () => {
      setView('home');
      setEditingId(null);
      setAdding(false);
      setPendingDelete(null);
      setToday(new Date());
    };
    window.addEventListener('mytodoUnlock', goHome);
    const back = isNativeAndroid()
      ? CapacitorApp.addListener('backButton', () => {
          const { view: current, editingId: editing, pendingDelete: deleting, adding: addingNow } = stateRef.current;
          if (deleting) setPendingDelete(null);
          else if (addingNow) setAdding(false);
          else if (editing) setEditingId(null);
          else if (current === 'history') setView('settings');
          else if (current === 'settings') setView('home');
          else void CapacitorApp.minimizeApp();
        })
      : null;
    const onVisible = () => {
      if (document.visibilityState === 'visible') setToday(new Date());
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('mytodoUnlock', goHome);
      document.removeEventListener('visibilitychange', onVisible);
      void back?.then(handle => handle.remove());
    };
  }, []);

  const doneToday = useMemo(() => {
    const start = startOfToday(today);
    return data.history.filter(item => (item.completedAt ?? 0) >= start).length;
  }, [data.history, today]);

  const add = useCallback((text: string, color: TodoColor | undefined, dueAt?: number) => {
    setData(current => addTodo(current, text, Date.now(), color, dueAt));
    setToday(new Date());
  }, []);

  const complete = useCallback(
    (id: string) => {
      if (completingId) return;
      const index = data.todos.findIndex(todo => todo.id === id);
      if (index < 0) return;
      setCompletingId(id);
      navigator.vibrate?.(14);
      window.setTimeout(() => {
        setData(current => completeTodo(current, id));
        setCompletingId(null);
        setToast({ message: '완료했어요', undo: () => setData(current => restoreTodo(current, id, index)) });
      }, COMPLETE_ANIMATION_MS);
    },
    [completingId, data.todos],
  );

  const remove = useCallback(
    (id: string) => {
      const index = data.todos.findIndex(todo => todo.id === id);
      const removed = data.todos[index];
      if (!removed) return;
      setData(current => deleteTodo(current, id));
      setToast({ message: '삭제했어요', undo: () => setData(current => insertTodo(current, removed, index)) });
    },
    [data.todos],
  );

  const runUndo = useCallback(() => {
    toast?.undo?.();
    setToast(null);
  }, [toast]);

  function requestDelete(id: string) {
    const todo = data.todos.find(item => item.id === id);
    if (todo) setPendingDelete({ kind: 'todo', id, text: todo.text });
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    if (pendingDelete.kind === 'todo') {
      remove(pendingDelete.id);
      if (editingId === pendingDelete.id) setEditingId(null);
    } else if (pendingDelete.kind === 'history') {
      const id = pendingDelete.id;
      setData(current => deleteHistoryItem(current, id));
    } else {
      setData(current => clearHistory(current));
    }
    setPendingDelete(null);
  }

  const editing = editingId ? data.todos.find(todo => todo.id === editingId) : undefined;
  const remaining = data.todos.length;

  let content: ReactNode;
  if (view === 'settings') {
    content = (
      <div className="mx-auto h-full max-w-xl">
        <SettingsView data={data} onBack={() => setView('home')} onOpenHistory={() => setView('history')} onReplaceData={setData} />
      </div>
    );
  } else if (view === 'history') {
    content = (
      <div className="mx-auto h-full max-w-xl">
        <HistoryView
          history={data.history}
          onBack={() => setView('settings')}
          onRestore={id => setData(current => restoreTodo(current, id))}
          onDelete={id => {
            const item = data.history.find(todo => todo.id === id);
            if (item) setPendingDelete({ kind: 'history', id, text: item.text });
          }}
          onClear={() => setPendingDelete({ kind: 'history-all', count: data.history.length })}
        />
      </div>
    );
  } else {
    content = (
      <div ref={rootRef} className="relative mx-auto flex h-full max-w-xl flex-col">
        <div className="flex shrink-0 justify-end px-3" style={{ paddingTop: 'var(--safe-top)' }}>
          <button
            type="button"
            onClick={() => setView('settings')}
            aria-label="설정"
            className="grid size-12 place-items-center rounded-full text-muted active:bg-sunken"
          >
            <Settings size={26} />
          </button>
        </div>

        <main className="flex-1 overflow-y-auto px-4 pt-1 pb-6">
          {remaining === 0 ? (
            <div className="mt-20 flex flex-col items-center gap-3 text-center text-muted">
              <CheckCheck size={52} strokeWidth={1.5} className={doneToday > 0 ? 'text-tag-green' : ''} />
              <p className="m-0 text-[19px] font-bold text-ink">{doneToday > 0 ? '할 일을 모두 끝냈어요' : '할 일이 없어요'}</p>
              <p className="m-0 text-[15px]">아래 추가 버튼으로 새 할 일을 추가해 보세요</p>
            </div>
          ) : (
            <TodoList
              todos={visibleTodos}
              completingId={completingId}
              onMove={(from, to) => setData(current => moveTodo(current, from, to))}
              onComplete={complete}
              onEdit={setEditingId}
              onDelete={requestDelete}
            />
          )}
        </main>

        {toast && (
          <Toast
            message={toast.message}
            actionLabel={toast.undo ? '되돌리기' : undefined}
            onAction={runUndo}
            onDone={() => setToast(null)}
          />
        )}

        <footer
          ref={footerRef}
          className="flex shrink-0 justify-end border-t border-line bg-bg px-4 pt-3"
          style={{ paddingBottom: 'calc(var(--safe-bottom) + 12px)' }}
        >
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex h-14 items-center gap-2 rounded-2xl bg-accent pr-6 pl-5 text-[18px] font-bold text-accent-ink active:opacity-80"
          >
            <Plus size={26} strokeWidth={2.6} />
            할 일 추가
          </button>
        </footer>

        {adding && <AddBar onAdd={add} onClose={() => setAdding(false)} />}

        {editing && (
          <EditSheet
            key={editing.id}
            todo={editing}
            onSave={(id, patch) => setData(current => editTodo(current, id, patch))}
            onDelete={requestDelete}
            onClose={() => setEditingId(null)}
          />
        )}
      </div>
    );
  }

  return (
    <>
      {content}
      {pendingDelete && (
        <DeleteConfirmDialog
          title={pendingDelete.kind === 'history-all' ? '완료 이력을 모두 삭제할까요?' : pendingDelete.kind === 'history' ? '완료 이력을 삭제할까요?' : '할 일을 삭제할까요?'}
          description={pendingDelete.kind === 'history-all' ? `완료 이력 ${pendingDelete.count}개를 모두 삭제해요. 삭제한 이력은 되돌릴 수 없어요.` : pendingDelete.kind === 'history' ? `“${pendingDelete.text}” 이력을 삭제해요. 삭제한 이력은 되돌릴 수 없어요.` : `“${pendingDelete.text}” 할 일을 삭제해요.`}
          onConfirm={confirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </>
  );
}
