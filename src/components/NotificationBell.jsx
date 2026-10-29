import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getNotifications, readAllNotifications, readNotification } from '../api/endpoints.js';
import { formatDateTime } from '../labels.js';

const POLL_MS = 30000;

/** S-09: колокольчик с числом непрочитанных и список уведомлений. */
export default function NotificationBell() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  const load = () => getNotifications().then(setItems).catch(() => {});

  useEffect(() => {
    load();
    const timer = setInterval(load, POLL_MS);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => {
      if (boxRef.current && !boxRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const unread = items.filter((n) => !n.isRead).length;

  // Открыли уведомление — отмечаем прочитанным только его.
  const openItem = (n) => {
    setOpen(false);
    if (n.isRead) return;
    setItems((list) => list.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
    readNotification(n.id).catch(() => {});
  };

  const readAll = async () => {
    await readAllNotifications();
    setItems((list) => list.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <div className="bell" ref={boxRef}>
      <button
        type="button"
        className="bell__button"
        aria-label={`Уведомления, непрочитанных: ${unread}`}
        onClick={() => setOpen((v) => !v)}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm7-6V11a7 7 0 0 0-5.5-6.84V3.5a1.5 1.5 0 0 0-3 0v.66A7 7 0 0 0 5 11v5l-2 2v1h18v-1l-2-2Z"
          />
        </svg>
        {unread > 0 && <span className="bell__count">{unread}</span>}
      </button>

      {open && (
        <div className="bell__panel" role="dialog" aria-label="Уведомления">
          <div className="bell__head">
            <strong>Уведомления</strong>
            {unread > 0 && (
              <button type="button" className="link-button" onClick={readAll}>
                Прочитать все
              </button>
            )}
          </div>
          {items.length === 0 && <p className="muted bell__empty">Пока уведомлений нет</p>}
          <ul className="bell__list">
            {items.map((n) => (
              <li key={n.id} className={n.isRead ? 'bell__item' : 'bell__item bell__item--new'}>
                {n.projectId ? (
                  <Link to={`/projects/${n.projectId}`} onClick={() => openItem(n)}>
                    {n.text}
                  </Link>
                ) : (
                  <span>{n.text}</span>
                )}
                <span className="muted small">{formatDateTime(n.createdAt)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
