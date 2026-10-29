import { useState } from 'react';
import { createTelegramLink, getTelegramStatus, unlinkTelegram } from '../api/endpoints.js';
import { useApi } from '../hooks/useApi.js';
import { formatDate } from '../labels.js';
import { useConfirm } from './ConfirmProvider.jsx';
import { ErrorNote } from './ui.jsx';

/**
 * Профиль → «Уведомления в Telegram» (UC-18, раздел 12.1 контракта).
 * Подключение: получить одноразовую ссылку на бота → открыть → нажать Start → «Проверить».
 */
export default function TelegramBlock() {
  const { status, data, error: loadError, reload } = useApi(getTelegramStatus, []);
  const [link, setLink] = useState(null);
  const [error, setError] = useState(null);
  const ask = useConfirm();

  const connect = async () => {
    setError(null);
    try {
      const created = await createTelegramLink();
      setLink(created);
      window.open(created.url, '_blank', 'noopener');
    } catch (e) {
      setError(e);
    }
  };

  const disconnect = async () => {
    if (!(await ask('Отключить уведомления в Telegram?', { confirmLabel: 'Отключить' }))) return;
    try {
      await unlinkTelegram();
      setLink(null);
      reload();
    } catch (e) {
      setError(e);
    }
  };

  return (
    <div className="card telegram">
      <h2 className="card__title">Уведомления в Telegram</h2>

      {status === 'loading' && <p className="muted small">Загрузка…</p>}
      {status === 'error' && <ErrorNote error={loadError} />}

      {status === 'ready' && !data.enabled && (
        <p className="muted small">Telegram недоступен: бот не настроен на сервере. Уведомления видны на сайте (колокольчик в шапке).</p>
      )}

      {status === 'ready' && data.enabled && data.linked && (
        <div className="actions">
          <span className="text-ok">Подключено{data.linkedAt ? ` с ${formatDate(data.linkedAt)}` : ''}</span>
          <button type="button" className="btn" onClick={disconnect}>
            Отключить
          </button>
        </div>
      )}

      {status === 'ready' && data.enabled && !data.linked && (
        <>
          <p className="muted small">
            Бот будет присылать новые заявки, решения по ним и изменения в команде — не нужно заходить на сайт, чтобы узнать
            статус.
          </p>
          {!link ? (
            <div className="actions">
              <button type="button" className="btn btn--primary" onClick={connect}>
                Подключить Telegram
              </button>
            </div>
          ) : (
            <div className="note">
              Откройте ссылку и нажмите <strong>Start</strong> в Telegram. Ссылка действует 10 минут:{' '}
              <a className="telegram__link" href={link.url} target="_blank" rel="noreferrer">
                {link.url}
              </a>
              <div className="actions">
                <button type="button" className="btn" onClick={reload}>
                  Проверить
                </button>
                <button type="button" className="link-button" onClick={connect}>
                  Новая ссылка
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <ErrorNote error={error} />
    </div>
  );
}
