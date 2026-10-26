import { useEffect } from 'react';
import { APPLICATION_STATUSES, CLOSE_REASONS, PROJECT_STATES, PROJECT_TYPES } from '../labels.js';

export function Badge({ tone = 'neutral', children }) {
  return <span className={`badge badge--${tone}`}>{children}</span>;
}

export function ProjectTypeBadge({ type }) {
  return <Badge tone="accent">{PROJECT_TYPES[type] ?? type}</Badge>;
}

export function ProjectStateBadge({ state }) {
  const tone = { RECRUITING: 'ok', IN_PROGRESS: 'ok', DRAFT: 'neutral', COMPLETED: 'neutral', CANCELLED: 'fail' }[state];
  return <Badge tone={tone}>{PROJECT_STATES[state] ?? state}</Badge>;
}

export function ApplicationStatusBadge({ status, closeReason }) {
  const tone = { PENDING: 'accent', ACCEPTED: 'ok', REJECTED: 'fail' }[status] ?? 'neutral';
  const text =
    status === 'CLOSED' && closeReason
      ? `Закрыта: ${CLOSE_REASONS[closeReason] ?? closeReason}`
      : APPLICATION_STATUSES[status] ?? status;
  return <Badge tone={tone}>{text}</Badge>;
}

/** Заполненность роли везде в одном формате «занято / всего» (FR-ROLE-07). */
export function Seats({ occupied, capacity }) {
  const full = occupied >= capacity;
  return <span className={full ? 'seats seats--full' : 'seats'}>{`${occupied} / ${capacity}`}</span>;
}

/** Сообщение об ошибке API: текст message от сервера (FR-UX-04). */
export function ErrorNote({ error }) {
  if (!error) return null;
  return (
    <div className="note note--error" role="alert">
      {error.message}
    </div>
  );
}

/** Ошибка конкретного поля из errors ответа VALIDATION_ERROR. */
export function FieldError({ error, field }) {
  const messages = error?.errors?.[field];
  if (!messages?.length) return null;
  return <span className="field__error">{messages.join(' ')}</span>;
}

export function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (event) => event.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal__window" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal__head">
          <h2 className="modal__title">{title}</h2>
          <button type="button" className="modal__close" aria-label="Закрыть" onClick={onClose}>
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
