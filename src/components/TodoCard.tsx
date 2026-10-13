import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CalendarDays, Check, GripVertical, Trash2 } from 'lucide-react';
import { useRef } from 'react';
import { classifyGesture, deleteDistance, shouldDelete, type Gesture } from '../lib/swipe';
import type { Todo } from '../lib/todos';
import { COLOR_VAR } from './colors';
import { formatSchedule } from '../lib/format';

interface Props {
  todo: Todo;
  /** True during the short moment between tapping the circle and the card leaving. */
  completing: boolean;
  onComplete: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const SNAP_MS = 180;

/**
 * Swipe left to right to delete: the card follows the finger over a red "삭제" layer and is
 * asks for confirmation when let go past the threshold. Touch only (a mouse drag would clash with drag
 * sorting); the edit sheet keeps a delete button for that.
 */
export function TodoCard({ todo, completing, onComplete, onEdit, onDelete }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: todo.id, disabled: todo.dueAt !== undefined });
  const stripe = todo.color ? COLOR_VAR[todo.color] : 'transparent';

  const content = useRef<HTMLDivElement>(null);
  const reveal = useRef<HTMLDivElement>(null);
  const touch = useRef<{ x: number; y: number; gesture: Gesture; id: number; crossed: boolean } | null>(null);
  const dragging = useRef(false);
  dragging.current = isDragging;

  function paint(dx: number, animate: boolean) {
    const el = content.current;
    const bg = reveal.current;
    if (!el || !bg) return;
    el.style.transition = animate ? `transform ${SNAP_MS}ms ease-out` : 'none';
    el.style.transform = dx ? `translateX(${dx}px)` : '';
    bg.style.opacity = String(Math.min(1, dx / deleteDistance(el.offsetWidth)));
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'mouse' || dragging.current || completing) return;
    touch.current = { x: event.clientX, y: event.clientY, gesture: 'pending', id: event.pointerId, crossed: false };
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const state = touch.current;
    if (!state || state.id !== event.pointerId) return;
    if (dragging.current) {
      touch.current = null;
      paint(0, true);
      return;
    }
    const dx = event.clientX - state.x;
    const dy = event.clientY - state.y;
    if (state.gesture === 'pending') {
      state.gesture = classifyGesture(dx, dy);
      if (state.gesture === 'scroll') {
        touch.current = null;
        return;
      }
      if (state.gesture === 'swipe') event.currentTarget.setPointerCapture(event.pointerId);
    }
    if (state.gesture !== 'swipe') return;
    const width = event.currentTarget.offsetWidth;
    const shown = Math.max(0, dx);
    paint(shown, false);
    const crossed = shouldDelete(shown, width);
    if (crossed !== state.crossed) {
      state.crossed = crossed;
      if (crossed) navigator.vibrate?.(10);
    }
  }

  function finish(event: React.PointerEvent<HTMLDivElement>, cancelled: boolean) {
    const state = touch.current;
    touch.current = null;
    if (!state || state.id !== event.pointerId || state.gesture !== 'swipe') return;
    const width = event.currentTarget.offsetWidth;
    const dx = Math.max(0, event.clientX - state.x);
    if (!cancelled && shouldDelete(dx, width)) {
      // Put the card back before opening the dialog so cancel leaves it fully visible.
      paint(0, true);
      onDelete(todo.id);
    } else {
      paint(0, true);
    }
  }

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: completing ? 'opacity 220ms, transform 220ms' : transition,
        opacity: completing ? 0 : 1,
        ...(completing ? { transform: 'translateX(24px)' } : {}),
        zIndex: isDragging ? 10 : undefined,
        touchAction: 'pan-y',
      }}
      className={`relative overflow-hidden rounded-2xl ${isDragging ? 'card-lift' : 'shadow-[0_1px_2px_rgb(0_0_0/0.06)]'}`}
      {...attributes}
      aria-disabled={undefined}
      {...listeners}
    >
      <div
        ref={reveal}
        aria-hidden
        className="absolute inset-0 flex items-center gap-2 bg-danger pl-5 text-[16px] font-bold text-white"
        style={{ opacity: 0 }}
      >
        <Trash2 size={22} /> 삭제
      </div>

      <div
        ref={content}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={event => finish(event, false)}
        onPointerCancel={event => finish(event, true)}
        className="relative flex min-h-[68px] items-center gap-3 bg-surface py-2 pr-2 pl-4"
      >
        <span className="absolute inset-y-0 left-0 w-1.5" style={{ background: stripe }} aria-hidden />

        <button
          type="button"
          aria-label={`${todo.text} 완료`}
          onClick={() => onComplete(todo.id)}
          className={`grid size-11 shrink-0 place-items-center rounded-full border-2 transition-colors ${
            completing ? 'pop border-accent bg-accent text-accent-ink' : 'border-muted/60 text-transparent active:border-accent'
          }`}
        >
          <Check size={20} strokeWidth={3} />
        </button>

        <button
          type="button"
          onClick={() => onEdit(todo.id)}
          className={`min-h-11 min-w-0 flex-1 py-2 text-left text-[19px] leading-snug font-semibold break-words ${completing ? 'text-muted line-through' : ''}`}
        >
          <span className="block">{todo.text}</span>
          {todo.dueAt !== undefined && (
            <span className="mt-1 block text-[13px] font-medium text-muted">{formatSchedule(todo.dueAt)}</span>
          )}
        </button>

        <span className="grid size-11 shrink-0 place-items-center text-muted/70" aria-hidden>
          {todo.dueAt !== undefined ? <CalendarDays size={20} /> : <GripVertical size={22} />}
        </span>
      </div>
    </li>
  );
}
