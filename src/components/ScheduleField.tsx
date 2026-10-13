import { CalendarDays, ChevronDown, X } from 'lucide-react';
import { useState } from 'react';

interface Props {
  id: string;
  value: string;
  onChange: (value: string) => void;
}

/** Optional, collapsed by default so quick entry still takes just one field. */
export function ScheduleField({ id, value, onChange }: Props) {
  const [expanded, setExpanded] = useState(Boolean(value));
  return (
    <div>
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={`${id}-panel`}
        onClick={() => setExpanded(open => !open)}
        className="flex min-h-11 items-center gap-2 text-[14px] font-semibold text-muted"
      >
        <CalendarDays size={18} />
        {value ? '날짜·시간 설정됨' : '날짜·시간 추가 (선택)'}
        <ChevronDown size={16} className={expanded ? 'rotate-180' : ''} />
      </button>
      {expanded && (
        <div id={`${id}-panel`} className="mb-3 rounded-2xl bg-sunken p-3">
          <label htmlFor={id} className="mb-2 block text-[14px] font-semibold">할 일 날짜·시간</label>
          <div className="flex items-center gap-2">
            <input
              id={id}
              type="datetime-local"
              value={value}
              onChange={event => onChange(event.target.value)}
              className="h-12 min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 text-[16px]"
            />
            {value && (
              <button type="button" aria-label="일정 지우기" onClick={() => onChange('')} className="grid size-12 shrink-0 place-items-center rounded-xl bg-surface text-muted">
                <X size={20} />
              </button>
            )}
          </div>
          <p className="m-0 mt-2 text-[12px] text-muted">현재 시각과 가까운 일정부터 위에 보여요</p>
        </div>
      )}
    </div>
  );
}
