import { getHealth } from '../api/client.js';
import { useApi } from '../hooks/useApi.js';

/** Доступность сервера по запросу GET /health. */
export default function ServerStatus() {
  const { status } = useApi(getHealth, []);

  const view = {
    loading: { mod: 'wait', text: 'Проверка сервера…' },
    ready: { mod: 'ok', text: 'Сервер доступен' },
    empty: { mod: 'ok', text: 'Сервер доступен' },
    error: { mod: 'off', text: 'Сервер недоступен' },
  }[status];

  return (
    <p className={`server server--${view.mod}`}>
      <span className="server__dot" aria-hidden="true" />
      {view.text}
    </p>
  );
}
