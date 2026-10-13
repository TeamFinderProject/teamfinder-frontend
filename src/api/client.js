// Единая точка обращения к backend.
// Контракты описаны в api-contracts-v1.md (репозиторий teamfinder-docs).
// В dev-режиме BASE пустой: запросы идут на свой origin и попадают в прокси Vite
// (см. vite.config.js), который переадресует их на ASP.NET Core.

const BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export class ApiError extends Error {
  constructor(message, { status = null, code = null, errors = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    // Для VALIDATION_ERROR: { поле: ["сообщение", ...] }
    this.errors = errors;
  }
}

function messageForStatus(status) {
  if (status === 404) return 'Данные не найдены';
  if (status === 401) return 'Требуется вход в систему';
  if (status === 403) return 'Нет доступа';
  if (status >= 500) return 'Ошибка на стороне сервера';
  return `Сервер ответил с кодом ${status}`;
}

async function request(path, options = {}) {
  let response;

  try {
    response = await fetch(BASE + path, {
      headers: { Accept: 'application/json' },
      ...options,
    });
  } catch {
    // Сюда попадаем, когда backend не запущен или недоступен.
    throw new ApiError('Не удалось связаться с сервером', { code: 'NETWORK_ERROR' });
  }

  if (!response.ok) {
    // Формат ошибки по контракту: { "code": "ERROR_CODE", "message": "Описание ошибки" },
    // для VALIDATION_ERROR дополнительно "errors": { поле: [сообщения] }.
    let body = null;
    try {
      body = await response.json();
    } catch {
      // тело не JSON — используем текст по коду ответа
    }
    throw new ApiError(body?.message || messageForStatus(response.status), {
      status: response.status,
      code: body?.code ?? null,
      errors: body?.errors ?? null,
    });
  }

  if (response.status === 204) return null;

  try {
    return await response.json();
  } catch {
    throw new ApiError('Сервер вернул ответ в неожиданном формате');
  }
}

/** Проверка доступности сервера: GET /health -> { status: "ok" } (есть в каркасе backend) */
export function getHealth() {
  return request('/health');
}

/** Справочник навыков: GET /api/skills -> [{ id, name }] (контракт, раздел 6.1) */
export async function getSkills() {
  const data = await request('/api/skills');
  return Array.isArray(data) ? data : [];
}
