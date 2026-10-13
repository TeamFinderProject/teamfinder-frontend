/**
 * Показывает состояние запроса: загрузка, ошибка или пустой результат.
 * Когда данные есть, возвращает null — экран рисует их сам.
 */
export default function RequestState({ status, error, onRetry, emptyText }) {
  if (status === 'loading') {
    return (
      <div className="state state--loading">
        <span className="spinner" aria-hidden="true" />
        <span>Загрузка…</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="state state--error" role="alert">
        <strong>Не удалось загрузить данные</strong>
        <span className="state__detail">{error?.message}</span>
        {onRetry && (
          <button type="button" className="btn" onClick={onRetry}>
            Повторить
          </button>
        )}
      </div>
    );
  }

  if (status === 'empty') {
    return (
      <div className="state state--empty">
        <strong>{emptyText || 'Пока ничего нет'}</strong>
        {onRetry && (
          <button type="button" className="btn" onClick={onRetry}>
            Обновить
          </button>
        )}
      </div>
    );
  }

  return null;
}
