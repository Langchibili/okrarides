// components/admin/Modal.js
'use client';
import { useEffect } from 'react';

export default function Modal({ open, onClose, title, children, size = 'md', footer, maxWidth }) {
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className={`modal-panel modal-${size}`} role="dialog" aria-modal="true" aria-label={title} style={{ maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth }}>
        <header>
          <h2>{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ×
          </button>
        </header>
        <div className="modal-content">{children}</div>
        {footer && <footer>{footer}</footer>}
      </div>
    </div>
  );
}

export function ConfirmModal({ open, onClose, onConfirm, title, message, confirmLabel = 'Delete', danger = true }) {
  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-gray-600 mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button type="button" onClick={onClose} className="button button-secondary">
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={`button ${danger ? 'button-danger' : 'button-primary'}`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}