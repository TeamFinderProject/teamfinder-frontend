# teamfinder-frontend

Клиентское приложение TeamFinder: React 18, React Router 6, Vite 5, JavaScript.
Экраны — по `ui-design.md`, запросы — по `api-contracts-v1.md` (оба в `teamfinder-docs`).

## Что работает (MVP, checkpoint 3)

| Маршрут | Экран | Запросы к API |
|---|---|---|
| `/login` | S-01 Вход и регистрация | `POST /api/auth/login`, `register` |
| `/catalog` | S-03 Каталог с фильтрами и страницами (по 10 проектов) | `GET /api/projects?q=&type=&roleTypeId=&skillId=&openOnly=&page=` |
| `/projects/new` | S-05 **Создание проекта сразу с ролями и навыками** | один `POST /api/projects` |
| `/projects/:id` | S-04 Проект, matching по каждой роли, **модалка отклика S-04a** | `GET /api/projects/{id}`, `.../roles/{roleId}/match`, `POST .../applications` |
| `/projects/:id/edit` | S-05 Редактирование, смена состояния, добавление роли | `PATCH /api/projects/{id}`, `POST .../publish|start|complete|cancel`, `POST .../roles` |
| `/projects/:id/roles/:roleId/edit` | S-06 Роль: блокировка навыков после заявок, закрыть, удалить | `PATCH`, `POST .../close`, `DELETE` |
| `/projects/:id/applications` | S-07 Заявки проекта (владелец): принять, отклонить | `GET /api/projects/{id}/applications`, `POST /api/applications/{id}/accept|reject` |
| `/applications` | S-07 Мои заявки: статус, причина закрытия, отзыв | `GET /api/applications/mine`, `POST .../withdraw` |
| `/projects/:id/team` | S-08 Команда: контакт, выход, исключение | `GET .../team`, `POST .../team/leave`, `DELETE .../members/{userId}` |
| `/projects/mine` | S-10 Мои проекты, у владельца число новых заявок | `GET /api/projects/mine` |
| `/profile` | S-02 Профиль, интересы, навыки, подключение Telegram | `GET/PUT /api/profile`, `/api/profile/telegram` |
| колокольчик в шапке | S-09 Уведомления | `GET /api/notifications`, `POST .../{id}/read`, `POST .../read-all` |

## Как устроен вход

`src/api/client.js`, решение — `teamfinder-docs/adr-001-authentication.md`:

- **access token** (JWT, 15 минут) хранится только в памяти — переменная в `client.js`, не `localStorage`, поэтому чужой скрипт на странице не может его прочитать из хранилища;
- **refresh token** приходит в HttpOnly-cookie `tf_refresh`. JS его не видит, браузер отправляет его только на `/api/auth/*`;
- при ответе `401` клиент один раз вызывает `POST /api/auth/refresh` и повторяет запрос. Если несколько запросов получили `401` одновременно, они ждут одно общее обновление;
- при открытии страницы `AuthProvider` вызывает `refresh` — так вход сохраняется после перезагрузки.

## Запуск

```bash
npm install
npm run dev        # http://localhost:5173
```

Нужен запущенный backend (`teamfinder-backend`, `dotnet run` → `http://localhost:5017`). Vite проксирует `/api` на него, поэтому браузер видит один origin: CORS не нужен, cookie `SameSite=Strict` работает.

Весь проект (frontend + backend + PostgreSQL) можно поднять одной командой из папки `teamfinder-backend`: `docker compose up -d --build`, сайт будет на `http://localhost:8081`. Frontend собирается `Dockerfile` из этого репозитория, nginx (`nginx.conf`) отдаёт статику и пересылает `/api` в backend.

| Переменная | По умолчанию | Назначение |
|---|---|---|
| `VITE_API_PROXY_TARGET` | `http://localhost:5017` | Куда dev-сервер проксирует `/api` (для Docker — `http://localhost:8080`) |
| `VITE_API_BASE_URL` | пусто | Префикс запросов; пусто — через прокси |

## Структура

```text
src/
  api/client.js        fetch, токены, обновление по 401, формат ошибок {code, message, errors}
  api/endpoints.js     по функции на каждый endpoint контракта, который нужен экранам
  auth/AuthContext.jsx сессия пользователя, RequireAuth
  components/          Layout, уведомления, MatchBlock, RoleFields (форма роли), Modal, бейджи,
                       ConfirmProvider (окна подтверждения), TelegramBlock (Telegram в профиле)
  hooks/useApi.js      состояния loading / error / empty / ready (FR-UX-03)
  pages/               экраны S-01 … S-10
  labels.js            подписи для значений перечислений API
```

## Правила интерфейса

- Ошибка API показывается текстом `message` с сервера (FR-UX-04). Ошибки полей (`errors`) — под нужным полем, включая поля внутри роли: `roles[1].capacity`.
- Недоступная кнопка отключается с подписью-причиной («Мест нет», «Набор закрыт»), но проверка всегда делается на сервере (FR-UX-02).
- Заполненность роли везде в формате «занято / всего» (FR-ROLE-07).
- Необратимые действия (принять, исключить, выйти, отозвать, перевести проект в работу, отменить, закрыть роль) подтверждаются своим окном `ConfirmProvider` в стиле приложения, а не стандартным `window.confirm`.
- Для показа можно войти демо-пользователем: `ivan@demo.local` / `petr@demo.local` / `anna@demo.local` / `maria@demo.local`, пароль `Demo12345!` (backend создаёт их в режиме разработки). Сценарий — `teamfinder-docs/demo-guide.md`.
