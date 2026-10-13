import { useCallback, useEffect, useState } from 'react';

/**
 * Выполняет запрос к API и отдаёт одно из четырёх состояний:
 *   loading — запрос выполняется
 *   error   — запрос не удался
 *   empty   — запрос удался, но данных нет (пустой массив)
 *   ready   — есть данные
 *
 * Требование FR-UX-03: каждый экран со списком обрабатывает загрузку,
 * ошибку и пустой результат.
 */
export function useApi(fetcher, deps = []) {
  const [state, setState] = useState({ status: 'loading', data: null, error: null });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(fetcher, deps);

  const load = useCallback(() => {
    let cancelled = false;
    setState({ status: 'loading', data: null, error: null });

    run()
      .then((data) => {
        if (cancelled) return;
        const isEmpty = Array.isArray(data) ? data.length === 0 : data == null;
        setState({ status: isEmpty ? 'empty' : 'ready', data, error: null });
      })
      .catch((error) => {
        if (cancelled) return;
        setState({ status: 'error', data: null, error });
      });

    return () => {
      cancelled = true;
    };
  }, [run]);

  useEffect(() => load(), [load]);

  return { ...state, reload: load };
}
