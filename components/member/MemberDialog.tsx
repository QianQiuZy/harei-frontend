'use client';

import { useEffect, useId, useRef, type MouseEvent, type ReactNode, type RefObject } from 'react';
import { s } from './MemberUI';
import { rememberFeedbackOpener } from './ActionFeedback';

function isBackdrop(event: MouseEvent<HTMLDialogElement>) {
  // The native backdrop and the dialog's own padding both target the dialog element.
  if (event.target !== event.currentTarget) return false;
  const { left, top, right, bottom } = event.currentTarget.getBoundingClientRect();
  return (
    event.clientX < left || event.clientX >= right || event.clientY < top || event.clientY >= bottom
  );
}

export function MemberDialog({
  title,
  opener,
  onDismiss,
  children
}: {
  title: string;
  opener: RefObject<HTMLButtonElement | null>;
  onDismiss: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const pressedBackdrop = useRef(false);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    rememberFeedbackOpener(dialog, opener.current);
    dialog.showModal();
    return () => dialog.close();
  }, [opener]);
  function dismiss() {
    ref.current?.close();
    onDismiss();
  }
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className={s.memberDialog}
      onPointerDown={(event) => {
        pressedBackdrop.current = event.isPrimary && event.button === 0 && isBackdrop(event);
      }}
      onPointerCancel={() => {
        pressedBackdrop.current = false;
      }}
      onClick={(event) => {
        const clickedBackdrop = pressedBackdrop.current && isBackdrop(event);
        pressedBackdrop.current = false;
        if (clickedBackdrop) dismiss();
      }}
      onCancel={(event) => {
        event.preventDefault();
        dismiss();
      }}
    >
      <header className={s.detailHeading}>
        <h2 id={titleId}>{title}</h2>
        <button type="button" className={s.secondary} onClick={dismiss}>
          取消
        </button>
      </header>
      {children}
    </dialog>
  );
}
