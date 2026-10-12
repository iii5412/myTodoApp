import { Ban } from 'lucide-react';
import { COLORS, type TodoColor } from '../lib/todos';
import { COLOR_LABEL, COLOR_VAR } from './colors';

interface Props {
  value: TodoColor | undefined;
  onChange: (color: TodoColor | undefined) => void;
}

/** Row of 44px touch targets; tapping the selected color clears it. */
export function ColorPicker({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-2" role="radiogroup" aria-label="색 라벨">
      <button
        type="button"
        role="radio"
        aria-checked={!value}
        aria-label="색 없음"
        onClick={() => onChange(undefined)}
        className={`grid size-11 place-items-center rounded-full border-2 text-muted ${value ? 'border-line' : 'border-ink'}`}
      >
        <Ban size={18} />
      </button>
      {COLORS.map(color => (
        <button
          key={color}
          type="button"
          role="radio"
          aria-checked={value === color}
          aria-label={COLOR_LABEL[color]}
          onClick={() => onChange(value === color ? undefined : color)}
          className={`size-11 rounded-full border-2 ${value === color ? 'border-ink' : 'border-transparent'}`}
          style={{ background: COLOR_VAR[color], boxShadow: value === color ? 'inset 0 0 0 3px var(--color-surface)' : undefined }}
        />
      ))}
    </div>
  );
}
