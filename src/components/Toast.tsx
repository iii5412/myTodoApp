import { useEffect } from 'react';

interface Props {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onDone: () => void;
  durationMs?: number;
}

/** Floats above the add bar. The action (e.g. 되돌리기) is a full-height tap target. */
export function Toast({ message, actionLabel, onAction, onDone, durationMs = 4000 }: Props) {
  useEffect(() => {
    const timer = setTimeout(onDone, durationMs);
    return () => clearTimeout(timer);
  }, [message, durationMs, onDone]);

  return (
    <div
      role="status"
      className="sheet-in pointer-events-auto absolute inset-x-4 z-20 flex h-14 items-center justify-between gap-3 rounded-2xl bg-ink pr-1.5 pl-5 text-[16px] font-semibold text-bg shadow-lg"
      style={{ bottom: 'calc(var(--add-bar-h, 96px) + 12px)' }}
    >
      <span className="truncate">{message}</span>
      {actionLabel && onAction && (
        <button type="button" onClick={onAction} className="h-11 shrink-0 rounded-xl px-4 font-bold text-accent">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
