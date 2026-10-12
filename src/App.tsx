import { App as CapacitorApp } from '@capacitor/app';
import { CheckCheck, Settings } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AddBar } from './components/AddBar';
import { EditSheet } from './components/EditSheet';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';
import { Toast } from './components/Toast';
import { TodoList } from './components/TodoList';
import { formatHeaderDate, startOfToday } from './lib/format';
import { isNativeAndroid } from './lib/platform';
import { loadData, saveData } from './lib/storage';
import {
  addTodo, clearHistory, completeTodo, deleteHistoryItem, deleteTodo, editTodo, moveTodo, restoreTodo,
  type AppData, type TodoColor,
} from './lib/todos';

type View = 'home' | 'settings' | 'history';
interface ToastState {
  message: string;
  undo?: { id: string; index: number };
}

const COMPLETE_ANIMATION_MS = 260;

export default function App() {
  const [data, setData] = useState<AppData>(loadData);
  const [view, setView] = useState<View>('home');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [today, setToday] = useState(() => new Date());
  const addBarRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    saveData(data);
  }, [data]);

  // Let the toast float just above the add bar, whatever its height (keyboard, color row).
  useLayoutEffect(() => {
    const bar = addBarRef.current;
    const root = rootRef.current;
    if (!bar || !root || view !== 'home') return;
    const update = () => root.style.setProperty('--add-bar-h', `${bar.offsetHeight}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(bar);
    return () => observer.disconnect();
  }, [view]);

  // Android back button and the unlock launch both land here.
  const stateRef = useRef({ view, editingId });
  stateRef.current = { view, editingId };
  useEffect(() => {
    const goHome = () => {
      setView('home');
      setEditingId(null);
      setToday(new Date());
    };
    window.addEventListener('mytodoUnlock', goHome);
    const back = isNativeAndroid()
      ? CapacitorApp.addListener('backButton', () => {
          const { view: current, editingId: editing } = stateRef.current;
          if (editing) setEditingId(null);
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

  const add = useCallback((text: string, color: TodoColor | undefined) => {
    setData(current => addTodo(current, text, Date.now(), color));
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
        setToast({ message: '완료했어요', undo: { id, index } });
      }, COMPLETE_ANIMATION_MS);
    },
    [completingId, data.todos],
  );

  const undoComplete = useCallback(() => {
    const undo = toast?.undo;
    if (!undo) return;
    setData(current => restoreTodo(current, undo.id, undo.index));
    setToast(null);
  }, [toast]);

  const editing = editingId ? data.todos.find(todo => todo.id === editingId) : undefined;
  const remaining = data.todos.length;
  const total = doneToday + remaining;

  if (view === 'settings') {
    return (
      <div className="mx-auto h-full max-w-xl">
        <SettingsView data={data} onBack={() => setView('home')} onOpenHistory={() => setView('history')} onReplaceData={setData} />
      </div>
    );
  }

  if (view === 'history') {
    return (
      <div className="mx-auto h-full max-w-xl">
        <HistoryView
          history={data.history}
          onBack={() => setView('settings')}
          onRestore={id => setData(current => restoreTodo(current, id))}
          onDelete={id => setData(current => deleteHistoryItem(current, id))}
          onClear={() => setData(clearHistory)}
        />
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative mx-auto flex h-full max-w-xl flex-col">
      <header className="shrink-0 px-5 pb-3" style={{ paddingTop: 'calc(var(--safe-top) + 20px)' }}>
        <div className="flex items-start justify-between">
          <div>
            <p className="m-0 text-[14px] font-semibold text-muted">{formatHeaderDate(today)}</p>
            <h1 className="m-0 mt-0.5 text-[30px] leading-tight font-extrabold tracking-tight">오늘 할 일</h1>
          </div>
          <button
            type="button"
            onClick={() => setView('settings')}
            aria-label="설정"
            className="-mt-1 -mr-2 grid size-12 place-items-center rounded-full text-muted active:bg-sunken"
          >
            <Settings size={26} />
          </button>
        </div>

        {total > 0 && (
          <div className="mt-4">
            <div className="flex items-baseline justify-between text-[14px] font-semibold">
              <span>
                <span className="text-[22px] font-extrabold text-accent">{remaining}</span>
                <span className="ml-1 text-muted">개 남음</span>
              </span>
              <span className="text-muted">오늘 {doneToday}개 완료</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-sunken" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={doneToday}>
              <div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${(doneToday / total) * 100}%` }} />
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 overflow-y-auto px-4 pt-1 pb-6">
        {remaining === 0 ? (
          <div className="mt-20 flex flex-col items-center gap-3 text-center text-muted">
            <CheckCheck size={52} strokeWidth={1.5} className={doneToday > 0 ? 'text-tag-green' : ''} />
            <p className="m-0 text-[19px] font-bold text-ink">{doneToday > 0 ? '오늘 할 일을 모두 끝냈어요' : '할 일이 없어요'}</p>
            <p className="m-0 text-[15px]">아래에서 새 할 일을 추가해 보세요</p>
          </div>
        ) : (
          <TodoList
            todos={data.todos}
            completingId={completingId}
            onMove={(from, to) => setData(current => moveTodo(current, from, to))}
            onComplete={complete}
            onEdit={setEditingId}
          />
        )}
      </main>

      {toast && (
        <Toast
          message={toast.message}
          actionLabel={toast.undo ? '되돌리기' : undefined}
          onAction={undoComplete}
          onDone={() => setToast(null)}
        />
      )}

      <div ref={addBarRef} className="shrink-0">
        <AddBar onAdd={add} />
      </div>

      {editing && (
        <EditSheet
          key={editing.id}
          todo={editing}
          onSave={(id, patch) => setData(current => editTodo(current, id, patch))}
          onDelete={id => setData(current => deleteTodo(current, id))}
          onClose={() => setEditingId(null)}
        />
      )}
    </div>
  );
}
