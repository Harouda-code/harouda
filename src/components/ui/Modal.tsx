import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import "./Modal.css";

type ModalProps = {
  open: boolean;
  title?: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  /** Wenn true: Klick auf Backdrop schließt NICHT. Für destruktive Dialoge. */
  dismissOnBackdrop?: boolean;
};

/**
 * Einheitlicher Modal-Dialog mit Backdrop, Titel-Bar und Footer-Bar.
 * Semantisch `role="dialog" aria-modal="true"`, unterstützt Esc zum Schließen.
 */
export function Modal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  size = "md",
  dismissOnBackdrop = true,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="ui-modal__backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "ui-modal-title" : undefined}
      onClick={(e) => {
        if (!dismissOnBackdrop) return;
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`ui-modal ui-modal--${size}`}>
        {title && (
          <header className="ui-modal__head">
            <div>
              <h2 id="ui-modal-title">{title}</h2>
              {description && <p>{description}</p>}
            </div>
            <button
              type="button"
              className="ui-modal__close"
              onClick={onClose}
              aria-label="Schließen"
            >
              <X size={18} />
            </button>
          </header>
        )}
        <div className="ui-modal__body">{children}</div>
        {footer && <footer className="ui-modal__foot">{footer}</footer>}
      </div>
    </div>
  );
}
