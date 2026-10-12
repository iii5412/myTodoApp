import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';

interface Props {
  title: string;
  onBack: () => void;
  right?: ReactNode;
}

export function PageHeader({ title, onBack, right }: Props) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-1 px-2" style={{ marginTop: 'var(--safe-top)' }}>
      <button type="button" onClick={onBack} aria-label="뒤로" className="grid size-12 place-items-center rounded-full active:bg-sunken">
        <ChevronLeft size={28} />
      </button>
      <h1 className="m-0 flex-1 text-[22px] font-bold">{title}</h1>
      {right}
    </header>
  );
}
