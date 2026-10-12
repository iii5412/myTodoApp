import { ArrowUp } from 'lucide-react';
import { useRef, useState } from 'react';
import type { TodoColor } from '../lib/todos';
import { ColorPicker } from './ColorPicker';

interface Props {
  onAdd: (text: string, color: TodoColor | undefined) => void;
}

/** Sits at the bottom where the thumb is. Color choices appear while typing. */
export function AddBar({ onAdd }: Props) {
  const [text, setText] = useState('');
  const [color, setColor] = useState<TodoColor | undefined>();
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const canSubmit = text.trim().length > 0;

  function submit() {
    if (!canSubmit) return;
    onAdd(text, color);
    setText('');
    // Keep the keyboard up so several tasks can be entered in a row.
    inputRef.current?.focus();
  }

  return (
    <form
      onSubmit={event => {
        event.preventDefault();
        submit();
      }}
      className="border-t border-line bg-bg/95 px-4 pt-3 backdrop-blur"
      style={{ paddingBottom: 'calc(var(--safe-bottom) + 12px)' }}
    >
      {(focused || canSubmit) && (
        <div
          className="fade-in mb-3 overflow-x-auto"
          // Keep the input focused (and the keyboard open) when a color is tapped.
          onPointerDown={event => event.preventDefault()}
        >
          <ColorPicker value={color} onChange={setColor} />
        </div>
      )}
      <div className="flex items-center gap-2.5">
        <input
          ref={inputRef}
          value={text}
          onChange={event => setText(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          enterKeyHint="done"
          maxLength={500}
          placeholder="할 일 추가"
          aria-label="할 일 추가"
          className="h-14 min-w-0 flex-1 rounded-2xl border border-line bg-surface px-4 text-[18px] outline-none placeholder:text-muted focus:border-accent"
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
  );
}
