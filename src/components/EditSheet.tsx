import { Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Todo, TodoColor } from '../lib/todos';
import { ColorPicker } from './ColorPicker';
import { ScheduleField } from './ScheduleField';
import { fromDateTimeInput, toDateTimeInput } from '../lib/format';

interface Props {
  todo: Todo;
  onSave: (id: string, patch: { text: string; color: TodoColor | null; dueAt: number | null }) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

/** Bottom sheet: easy to reach with the thumb, closes by tapping outside. */
export function EditSheet({ todo, onSave, onDelete, onClose }: Props) {
  const [text, setText] = useState(todo.text);
  const [color, setColor] = useState<TodoColor | undefined>(todo.color);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [schedule, setSchedule] = useState(() => toDateTimeInput(todo.dueAt));
  const area = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = area.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, []);

  function save() {
    onSave(todo.id, { text, color: color ?? null, dueAt: fromDateTimeInput(schedule) ?? null });
    onClose();
  }

  return (
    <div className="fade-in fixed inset-0 z-30 flex items-end bg-black/45" onClick={onClose}>
      <div
        role="dialog"
        aria-label="할 일 수정"
        className="sheet-in max-h-[90dvh] w-full overflow-y-auto rounded-t-3xl bg-surface px-5 pt-5"
        style={{ paddingBottom: 'calc(var(--safe-bottom) + 20px)' }}
        onClick={event => event.stopPropagation()}
      >
        <textarea
          ref={area}
          value={text}
          onChange={event => setText(event.target.value)}
          rows={3}
          maxLength={500}
          aria-label="할 일 내용"
          className="w-full resize-none rounded-2xl border border-line bg-bg p-4 text-[19px] leading-snug font-semibold outline-none focus:border-accent"
        />

        <div className="mt-4 overflow-x-auto">
          <ColorPicker value={color} onChange={setColor} />
        </div>

        <div className="mt-2">
          <ScheduleField id="edit-schedule" value={schedule} onChange={setSchedule} />
        </div>

        <div className="mt-5 flex gap-3">
          {confirmDelete ? (
            <button
              type="button"
              onClick={() => {
                onDelete(todo.id);
                onClose();
              }}
              className="h-14 flex-1 rounded-2xl bg-danger text-[17px] font-bold text-white"
            >
              정말 삭제
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              aria-label="삭제"
              className="grid size-14 shrink-0 place-items-center rounded-2xl bg-sunken text-danger"
            >
              <Trash2 size={22} />
            </button>
          )}
          <button
            type="button"
            onClick={save}
            disabled={!text.trim()}
            className="h-14 flex-1 rounded-2xl bg-accent text-[17px] font-bold text-accent-ink disabled:opacity-35"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
