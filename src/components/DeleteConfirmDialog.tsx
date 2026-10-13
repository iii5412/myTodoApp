import { useId, useLayoutEffect, useRef } from 'react';

interface Props {
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Native modal dialog traps focus and keeps the list inert until the user decides. */
export function DeleteConfirmDialog({ title, description, onConfirm, onCancel }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    dialog?.showModal();
    cancelRef.current?.focus();
    return () => {
      dialog?.close();
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      role="alertdialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={event => {
        event.preventDefault();
        onCancel();
      }}
      onClick={event => {
        if (event.target === event.currentTarget) onCancel();
      }}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-32px)] max-w-sm overflow-y-auto rounded-3xl border-0 bg-surface p-0 text-ink shadow-xl backdrop:bg-black/55"
    >
      <div className="p-5">
        <h2 id={titleId} className="m-0 text-[21px] font-bold">{title}</h2>
        <p id={descriptionId} className="mt-3 mb-5 max-h-40 overflow-y-auto text-[16px] leading-relaxed break-words text-muted">{description}</p>
        <div className="flex gap-3">
          <button ref={cancelRef} type="button" onClick={onCancel} className="h-14 flex-1 rounded-2xl bg-sunken text-[17px] font-bold">취소</button>
          <button type="button" onClick={onConfirm} className="h-14 flex-1 rounded-2xl bg-danger text-[17px] font-bold text-white">삭제</button>
        </div>
      </div>
    </dialog>
  );
}
