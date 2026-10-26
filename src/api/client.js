// Единая точка обращения к backend по контракту api-contracts-v1.md (teamfinder-docs).
//
// Аутентификация (docs/adr-001-authentication.md):
// - access token (JWT, 15 минут) хранится только в памяти — в переменной ниже, не в localStorage;
// - refresh token лежит в HttpOnly-cookie tf_refresh, JS его не видит, браузер отправляет его сам;
// - на ответ 401 клиент один раз обновляет access token через POST /api/auth/refresh и повторяет запрос;
// - одновременные запросы ждут одно общее обновление (refreshPromise), а не запускают несколько.

const BASE = import.meta.env.VITE_API_BASE_URL ?? '';

let accessToken = null;
let refreshPromise = null;
const sessionListeners = new Set();

export class ApiError extends Error {
  constructor(message, { status = null, code = null, errors = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    // Стабильный код из раздела 14 контракта: ROLE_FULL, DUPLICATE_APPLICATION ...
    this.code = code;
    // Для VALIDATION_ERROR: { "roles[1].capacity": ["..."] }
    this.errors = errors;
  }
}

/** Подписка на изменение сессии (вход, выход, истечение). Возвращает функцию отписки. */
export function onSessionChange(listener) {
  sessionListeners.add(listener);
  return () => sessionListeners.delete(listener);
}

function setSession(auth) {
  accessToken = auth?.accessToken ?? null;
  const user = auth?.user ?? null;
  sessionListeners.forEach((listener) => listener(user));
  return user;
}

function messageForStatus(status) {
  if (status === 401) return 'Требуется вход в систему';
  if (status === 403) return 'Нет доступа';
  if (status === 404) return 'Данные не найдены';
  if (status >= 500) return 'Ошибка на стороне сервера';
  return `Сервер ответил с кодом ${status}`;
}

async function send(path, { method = 'GET', body } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  try {
    return await fetch(BASE + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: 'include',
    });
  } catch {
    throw new ApiError('Не удалось связаться с сервером', { code: 'NETWORK_ERROR' });
  }
}

async function parse(response) {
  if (response.status === 204) return null;
  const text = await response.text();
  const data = text ? safeJson(text) : null;

  if (!response.ok) {
    // Формат ошибки по контракту: { code, message, errors? }
    throw new ApiError(data?.message || messageForStatus(response.status), {
      status: response.status,
      code: data?.code ?? null,
      errors: data?.errors ?? null,
    });
  }
  return data;
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** Обновить access token по refresh-cookie. Возвращает пользователя или null, если сессии нет. */
export function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = fetch(`${BASE}/api/auth/refresh`, { method: 'POST', credentials: 'include' })
      .then(async (response) => (response.ok ? setSession(await response.json()) : setSession(null)))
      .catch(() => setSession(null))
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

/** Запрос к API. На 401 — одна попытка обновить токен и повторить. */
export async function request(path, options = {}) {
  let response = await send(path, options);

  if (response.status === 401 && !path.startsWith('/api/auth/')) {
    const user = await refreshSession();
    if (user) response = await send(path, options);
  }
  return parse(response);
}

// ---------- Auth ----------

export async function register(email, password, displayName) {
  return setSession(await request('/api/auth/register', { method: 'POST', body: { email, password, displayName } }));
}

export async function login(email, password) {
  return setSession(await request('/api/auth/login', { method: 'POST', body: { email, password } }));
}

export async function logout() {
  try {
    await request('/api/auth/logout', { method: 'POST' });
  } finally {
    setSession(null);
  }
}
