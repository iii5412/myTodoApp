import { Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Todo, TodoColor } from '../lib/todos';
import { ColorPicker } from './ColorPicker';
import { ScheduleField } from './ScheduleField';
import { formatSchedule, fromDateTimeInput, toDateTimeInput } from '../lib/format';
import { inferEditedSchedule } from '../lib/schedule';

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
  const [schedule, setSchedule] = useState(() => toDateTimeInput(todo.dueAt));
  const [manualSchedule, setManualSchedule] = useState(false);
  const [autoScheduleChanged, setAutoScheduleChanged] = useState(false);
  const scheduleReference = useRef(new Date());
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
          onChange={event => {
            const nextText = event.target.value;
            if (!manualSchedule) {
              const nextSchedule = toDateTimeInput(inferEditedSchedule(text, nextText, fromDateTimeInput(schedule), scheduleReference.current));
              if (nextSchedule !== schedule) {
                setSchedule(nextSchedule);
                setAutoScheduleChanged(true);
              }
            }
            setText(nextText);
          }}
          rows={3}
          maxLength={500}
          aria-label="할 일 내용"
          className="w-full resize-none rounded-2xl border border-line bg-bg p-4 text-[19px] leading-snug font-semibold outline-none focus:border-accent"
        />

        <div className="mt-4 overflow-x-auto">
          <ColorPicker value={color} onChange={setColor} />
        </div>

        <div className="mt-2">
          <ScheduleField id="edit-schedule" value={schedule} onChange={value => {
            setManualSchedule(true);
            setAutoScheduleChanged(false);
            setSchedule(value);
          }} />
          {autoScheduleChanged && (
            <p role="status" className="m-0 mt-1 text-[13px] text-muted">
              {schedule ? `내용에 맞춰 변경 · ${formatSchedule(fromDateTimeInput(schedule)!)}` : '내용에서 일정을 인식하지 못해 해제했어요'}
            </p>
          )}
        </div>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={() => onDelete(todo.id)}
            aria-label="삭제"
            className="grid size-14 shrink-0 place-items-center rounded-2xl bg-sunken text-danger"
          >
            <Trash2 size={22} />
          </button>
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
