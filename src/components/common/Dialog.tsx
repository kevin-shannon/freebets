import { ReactNode, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import "./Dialog.css";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function Dialog({ open, onClose, title, children, className = "" }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pointerOutside = useRef(false);
  const titleId = useId();

  useEffect(() => {
    if (!open || !dialogRef.current) return;
    const dialog = dialogRef.current;
    const trigger = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, [open]);

  const outside = (x: number, y: number) => {
    const box = dialogRef.current!.getBoundingClientRect();
    return x < box.left || x > box.right || y < box.top || y > box.bottom;
  };

  return createPortal(
    <dialog
      ref={dialogRef}
      className={`app-dialog ${className}`}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onPointerDown={(event) => {
        pointerOutside.current = outside(event.clientX, event.clientY);
      }}
      onPointerUp={(event) => {
        if (pointerOutside.current && outside(event.clientX, event.clientY)) onClose();
      }}
    >
      <div className="dialog-header">
        <h2 id={titleId}>{title}</h2>
        <button type="button" className="icon-button dialog-close" onClick={onClose} aria-label="Close dialog">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>
      </div>
      <div className="dialog-body">{children}</div>
    </dialog>,
    document.body,
  );
}
