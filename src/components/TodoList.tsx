import { closestCenter, DndContext, MouseSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Todo } from '../lib/todos';
import { TodoCard } from './TodoCard';

interface Props {
  todos: Todo[];
  completingId: string | null;
  onMove: (fromId: string, toId: string) => void;
  onComplete: (id: string) => void;
  onEdit: (id: string) => void;
}

/**
 * Touch: press and hold a card for a moment, then drag. A quick swipe still
 * scrolls the list. Mouse: drag after a few pixels.
 */
export function TodoList({ todos, completingId, onMove, onComplete, onEdit }: Props) {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
  );

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (over && active.id !== over.id) {
      onMove(String(active.id), String(over.id));
      navigator.vibrate?.(8);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      onDragStart={() => navigator.vibrate?.(12)}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={todos.map(todo => todo.id)} strategy={verticalListSortingStrategy}>
        <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
          {todos.map(todo => (
            <TodoCard key={todo.id} todo={todo} completing={completingId === todo.id} onComplete={onComplete} onEdit={onEdit} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
