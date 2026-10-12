import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Check, GripVertical } from 'lucide-react';
import type { Todo } from '../lib/todos';
import { COLOR_VAR } from './colors';

interface Props {
  todo: Todo;
  /** True during the short moment between tapping the circle and the card leaving. */
  completing: boolean;
  onComplete: (id: string) => void;
  onEdit: (id: string) => void;
}

export function TodoCard({ todo, completing, onComplete, onEdit }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: todo.id });
  const stripe = todo.color ? COLOR_VAR[todo.color] : 'transparent';

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: completing ? 'opacity 220ms, transform 220ms' : transition,
        opacity: completing ? 0 : 1,
        ...(completing ? { transform: 'translateX(24px)' } : {}),
        zIndex: isDragging ? 10 : undefined,
        touchAction: 'manipulation',
      }}
      className={`relative flex min-h-[68px] items-center gap-3 overflow-hidden rounded-2xl bg-surface py-2 pr-2 pl-4 ${isDragging ? 'card-lift' : 'shadow-[0_1px_2px_rgb(0_0_0/0.06)]'}`}
      {...attributes}
      {...listeners}
    >
      <span className="absolute inset-y-0 left-0 w-1.5" style={{ background: stripe }} aria-hidden />

      <button
        type="button"
        aria-label={`${todo.text} 완료`}
        onClick={() => onComplete(todo.id)}
        className={`grid size-9 shrink-0 place-items-center rounded-full border-2 transition-colors ${
          completing ? 'pop border-accent bg-accent text-accent-ink' : 'border-muted/60 text-transparent active:border-accent'
        }`}
      >
        <Check size={20} strokeWidth={3} />
      </button>

      <button
        type="button"
        onClick={() => onEdit(todo.id)}
        className={`min-w-0 flex-1 py-2 text-left text-[19px] leading-snug font-semibold break-words ${completing ? 'text-muted line-through' : ''}`}
      >
        {todo.text}
      </button>

      <span className="grid size-11 shrink-0 place-items-center text-muted/70" aria-hidden>
        <GripVertical size={22} />
      </span>
    </li>
  );
}
