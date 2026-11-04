import { ArrowUp } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { MEDICATION_TIMES, type MedicationTime, type TodoColor } from '../lib/todos';
import { formatSchedule, fromDateTimeInput, toDateTimeInput } from '../lib/format';
import { inferSchedule } from '../lib/schedule';
import { ColorPicker } from './ColorPicker';
import { ScheduleField } from './ScheduleField';

interface Props {
  onAdd: (text: string, color: TodoColor | undefined, dueAt: number | undefined, repeatDaily: boolean, medicationTimes: MedicationTime[]) => void;
  onClose: () => void;
}

/** Bottom sheet opened from the footer button. It stays open after adding so several tasks can be entered in a row. */
export function AddBar({ onAdd, onClose }: Props) {
  const [text, setText] = useState('');
  const [color, setColor] = useState<TodoColor | undefined>();
  const [schedule, setSchedule] = useState('');
  const [manualSchedule, setManualSchedule] = useState(false);
  const [repeatDaily, setRepeatDaily] = useState(false);
  const [medicationTimes, setMedicationTimes] = useState<MedicationTime[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const canSubmit = text.trim().length > 0;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function submit() {
    if (!canSubmit) return;
    onAdd(text, color, fromDateTimeInput(schedule), repeatDaily, medicationTimes);
    setText('');
    setSchedule('');
    setManualSchedule(false);
    setRepeatDaily(false);
    setMedicationTimes([]);
    // Keep the keyboard up for the next one.
    inputRef.current?.focus();
  }

  return (
    <div className="fade-in fixed inset-0 z-30 flex items-end bg-black/45" onClick={onClose}>
      <form
        role="dialog"
        aria-label="할 일 추가"
        onClick={event => event.stopPropagation()}
        onSubmit={event => {
          event.preventDefault();
          submit();
        }}
        className="sheet-in max-h-[90dvh] w-full overflow-y-auto rounded-t-3xl bg-surface px-4 pt-3"
        style={{ paddingBottom: 'calc(var(--safe-bottom) + 16px)' }}
      >
        <ScheduleField id="add-schedule" value={schedule} onChange={value => {
          setManualSchedule(true);
          setSchedule(value);
        }} />
        {schedule && !manualSchedule && (
          <p role="status" className="m-0 mb-3 text-[13px] text-muted">
            자동 설정 · {formatSchedule(fromDateTimeInput(schedule)!)} · 위에서 수정 가능
          </p>
        )}
        <label className="mb-2 flex min-h-11 items-center gap-3 text-[16px] font-semibold">
          <input type="checkbox" checked={repeatDaily} onChange={event => setRepeatDaily(event.target.checked)} className="size-5 accent-accent" />
          매일 반복 <span className="text-[13px] font-normal text-muted">완료하면 다음 날 다시 표시</span>
        </label>
        <fieldset className="m-0 mb-3 border-0 p-0">
          <legend className="text-[16px] font-semibold">약 복용 시간 <span className="text-[13px] font-normal text-muted">선택 사항 · 시간별로 따로 완료</span></legend>
          <div className="mt-1 flex gap-2">
            {MEDICATION_TIMES.map(time => (
              <label key={time} className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-line bg-bg text-[16px] font-semibold">
                <input type="checkbox" checked={medicationTimes.includes(time)} onChange={event => setMedicationTimes(current => event.target.checked ? [...current, time] : current.filter(item => item !== time))} className="size-5 accent-accent" />
                {time}
              </label>
            ))}
          </div>
          <p className="m-0 mt-1 text-[13px] text-muted">아침 7시 · 점심 12시 · 저녁 6시부터 표시</p>
          {repeatDaily && medicationTimes.length > 0 && <p className="m-0 text-[13px] text-muted">매일 새로 표시하며, 전날 못 한 복용은 쌓이지 않아요</p>}
        </fieldset>
        <div
          className="mb-3 overflow-x-auto"
          // Keep the input focused (and the keyboard open) when a color is tapped.
          onPointerDown={event => event.preventDefault()}
        >
          <ColorPicker value={color} onChange={setColor} />
        </div>
        <div className="flex items-center gap-2.5">
          <input
            ref={inputRef}
            value={text}
            onChange={event => {
              const next = event.target.value;
              setText(next);
              if (!manualSchedule) setSchedule(toDateTimeInput(inferSchedule(next)));
            }}
            enterKeyHint="done"
            maxLength={500}
            placeholder="할 일 추가"
            aria-label="할 일 추가"
            className="h-14 min-w-0 flex-1 rounded-2xl border border-line bg-bg px-4 text-[18px] outline-none placeholder:text-muted focus:border-accent"
          />
          <button
            type="submit"
            disabled={!canSubmit}
            aria-label="추가"
            className="grid size-14 shrink-0 place-items-center rounded-2xl bg-accent text-accent-ink transition-opacity disabled:opacity-35"
          >
            <ArrowUp size={26} strokeWidth={2.6} />
          </button>
        </div>
      </form>
    </div>
  );
}
