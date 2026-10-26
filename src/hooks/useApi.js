import { useCallback, useEffect, useState } from 'react';

/**
 * Выполняет запрос к API и отдаёт одно из четырёх состояний:
 *   loading — запрос выполняется
 *   error   — запрос не удался
 *   empty   — запрос удался, но данных нет (пустой массив или страница без элементов)
 *   ready   — есть данные
 * FR-UX-03: каждый экран со списком обрабатывает загрузку, ошибку и пустой результат.
 * reload() перезапрашивает данные, например после действия пользователя.
 */
export function useApi(fetcher, deps = []) {
  const [state, setState] = useState({ status: 'loading', data: null, error: null });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(fetcher, deps);

  const load = useCallback(
    ({ silent = false } = {}) => {
      let cancelled = false;
      if (!silent) setState({ status: 'loading', data: null, error: null });

      run()
        .then((data) => {
          if (cancelled) return;
          const items = Array.isArray(data) ? data : data?.items;
          const isEmpty = data == null || (Array.isArray(items) && items.length === 0);
          setState({ status: isEmpty ? 'empty' : 'ready', data, error: null });
        })
        .catch((error) => {
          if (!cancelled) setState({ status: 'error', data: null, error });
        });

      return () => {
        cancelled = true;
      };
    },
    [run],
  );

  useEffect(() => load(), [load]);

  return { ...state, reload: () => load({ silent: true }) };
}
