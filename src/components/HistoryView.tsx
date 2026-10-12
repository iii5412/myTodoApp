import { CheckCheck, RotateCcw, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { formatDayLabel, formatTime } from '../lib/format';
import { groupByDay, type Todo } from '../lib/todos';
import { COLOR_VAR } from './colors';
import { PageHeader } from './PageHeader';

interface Props {
  history: Todo[];
  onBack: () => void;
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}

export function HistoryView({ history, onBack, onRestore, onDelete, onClear }: Props) {
  const groups = useMemo(() => groupByDay(history), [history]);
  const [confirmClear, setConfirmClear] = useState(false);

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="완료 이력"
        onBack={onBack}
        right={
          history.length > 0 && (
            <button
              type="button"
              onClick={() => (confirmClear ? (setConfirmClear(false), onClear()) : setConfirmClear(true))}
              onBlur={() => setConfirmClear(false)}
              className={`mr-2 h-11 rounded-xl px-4 text-[15px] font-bold ${confirmClear ? 'bg-danger text-white' : 'text-danger'}`}
            >
              {confirmClear ? '정말 모두 삭제' : '전체 삭제'}
            </button>
          )
        }
      />

      <div className="flex-1 overflow-y-auto px-4" style={{ paddingBottom: 'calc(var(--safe-bottom) + 24px)' }}>
        {history.length === 0 ? (
          <div className="mt-24 flex flex-col items-center gap-3 text-center text-muted">
            <CheckCheck size={44} strokeWidth={1.6} />
            <p className="m-0 text-[17px]">아직 완료한 일이 없어요</p>
          </div>
        ) : (
          groups.map(group => (
            <section key={group.day} className="mb-6">
              <h2 className="sticky top-0 z-10 m-0 bg-bg/95 py-2 text-[14px] font-bold text-muted backdrop-blur">
                {formatDayLabel(group.day)} · {group.items.length}개
              </h2>
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {group.items.map(item => (
                  <li key={item.id} className="relative flex min-h-[60px] items-center gap-2 overflow-hidden rounded-2xl bg-surface py-2 pr-1 pl-4">
                    <span
                      className="absolute inset-y-0 left-0 w-1.5"
                      style={{ background: item.color ? COLOR_VAR[item.color] : 'transparent' }}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p className="m-0 text-[17px] leading-snug break-words text-muted line-through decoration-muted/50">{item.text}</p>
                      <p className="m-0 mt-0.5 text-[13px] text-muted">{formatTime(item.completedAt ?? item.createdAt)} 완료</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRestore(item.id)}
                      aria-label={`${item.text} 다시 할 일로`}
                      className="grid size-11 shrink-0 place-items-center rounded-full text-accent active:bg-sunken"
                    >
                      <RotateCcw size={21} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(item.id)}
                      aria-label={`${item.text} 이력 삭제`}
                      className="grid size-11 shrink-0 place-items-center rounded-full text-muted active:bg-sunken"
                    >
                      <Trash2 size={20} />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
