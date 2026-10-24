'use client';

import { useEffect } from 'react';

export function PageHeader({ title, subtitle, description, actions, action }) {
  return (
    <header className="page-heading">
      <div>
        <h1>{title}</h1>
        {(subtitle || description) && <p>{subtitle || description}</p>}
      </div>
      {(actions || action) && <div className="page-actions">{actions || action}</div>}
    </header>
  );
}

export function SearchBar({ value, onChange, placeholder = 'Search…' }) {
  return (
    <label className="search-field">
      <span aria-hidden="true">⌕</span>
      <input type="search" value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  );
}

export function FilterBar({ children }) {
  return <div className="filter-bar">{children}</div>;
}

export function StatusPill({ status }) {
  const value = String(status ?? 'unknown').toLowerCase().replace(/[\s_]+/g, '-');
  return <span className={`status-pill status-${value}`}>{String(status ?? 'Unknown').replace(/_/g, ' ')}</span>;
}

export function Avatar({ firstName, lastName, username, size = 36 }) {
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}` || username?.[0] || '?';
  return <span className="user-avatar" style={{ width: size, height: size }}>{initials.toUpperCase()}</span>;
}

export function FormField({ label, required, children, description }) {
  return (
    <label className="form-field">
      <span>{label}{required && <em> *</em>}</span>
      {children}
      {description && <small>{description}</small>}
    </label>
  );
}

export function StatCard({ label, value, icon, color = 'green', sub }) {
  return (
    <article className={`stat-card stat-${color}`}>
      <div className="stat-card-top">
        <span>{label}</span><span className="stat-icon">{icon}</span>
      </div>
      <strong>{value}</strong>
      {sub && <small>{sub}</small>}
    </article>
  );
}

export function Modal({ open, onClose, title, children, footer, maxWidth, size = 'md' }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = event => {
      if (event.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;
  const width = typeof maxWidth === 'number' ? `${maxWidth}px` : undefined;
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={event => event.target === event.currentTarget && onClose?.()}>
      <section className={`modal-panel modal-${size}`} role="dialog" aria-modal="true" aria-label={title} style={{ maxWidth: width }}>
        <header><h2>{title}</h2><button type="button" onClick={onClose} aria-label="Close dialog">×</button></header>
        <div className="modal-content">{children}</div>
        {footer && <footer>{footer}</footer>}
      </section>
    </div>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  danger = true,
  busy = false,
}) {
  if (!open) return null;
  return (
    <Modal open={open} onClose={busy ? undefined : onClose} title={title} size="sm">
      <p style={{ color: 'var(--text-secondary)', margin: '0 0 20px' }}>{message}</p>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>Cancel</button>
        <button type="button" className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm} disabled={busy}>
          {busy ? 'Please wait…' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

export function ActionIcon({ name }) {
  if (name === 'cash') {
    return (
      <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <circle cx="12" cy="12" r="3" />
        <path d="M7 9h.01M17 15h.01" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m14 5 5 5M4 20l4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z" />
    </svg>
  );
}
