// Вызовы API. Каждая функция соответствует endpoint'у из api-contracts-v1.md.
import { request } from './client.js';

const json = (method, body) => ({ method, body });
const query = (params) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== false) search.set(key, String(value));
  });
  const text = search.toString();
  return text ? `?${text}` : '';
};

// Справочники (раздел 6)
export const getSkills = () => request('/api/skills');
export const getRoleTypes = () => request('/api/role-types');

// Профиль (раздел 5)
export const getProfile = () => request('/api/profile');
export const saveProfile = (profile) => request('/api/profile', json('PUT', profile));

// Проекты (раздел 7)
export const getCatalog = (filters) => request(`/api/projects${query(filters)}`);
export const getMyProjects = () => request('/api/projects/mine');
export const getProject = (projectId) => request(`/api/projects/${projectId}`);
/** Проект вместе с ролями и навыками — один запрос (7.3). */
export const createProject = (project) => request('/api/projects', json('POST', project));
export const updateProject = (projectId, changes) => request(`/api/projects/${projectId}`, json('PATCH', changes));
export const changeProjectState = (projectId, action) =>
  request(`/api/projects/${projectId}/${action}`, { method: 'POST' }); // publish | start | complete | cancel

// Роли (раздел 8)
export const addRole = (projectId, role) => request(`/api/projects/${projectId}/roles`, json('POST', role));
export const updateRole = (projectId, roleId, changes) =>
  request(`/api/projects/${projectId}/roles/${roleId}`, json('PATCH', changes));
export const closeRole = (projectId, roleId) =>
  request(`/api/projects/${projectId}/roles/${roleId}/close`, { method: 'POST' });
export const deleteRole = (projectId, roleId) =>
  request(`/api/projects/${projectId}/roles/${roleId}`, { method: 'DELETE' });
export const getMatch = (projectId, roleId) => request(`/api/projects/${projectId}/roles/${roleId}/match`);

// Заявки (раздел 10)
export const applyToRole = (projectId, roleId, message) =>
  request(`/api/projects/${projectId}/roles/${roleId}/applications`, json('POST', { message: message || null }));
export const getMyApplications = () => request('/api/applications/mine');
export const getProjectApplications = (projectId, filters = {}) =>
  request(`/api/projects/${projectId}/applications${query(filters)}`);
export const withdrawApplication = (id) => request(`/api/applications/${id}/withdraw`, { method: 'POST' });
export const acceptApplication = (id) => request(`/api/applications/${id}/accept`, { method: 'POST' });
export const rejectApplication = (id) => request(`/api/applications/${id}/reject`, { method: 'POST' });

// Команда (раздел 11)
export const getTeam = (projectId) => request(`/api/projects/${projectId}/team`);
export const leaveTeam = (projectId) => request(`/api/projects/${projectId}/team/leave`, { method: 'POST' });
/** id участника — в пути: у DELETE нет тела (2.6, 11.3 контракта). */
export const removeMember = (projectId, userId) =>
  request(`/api/projects/${projectId}/members/${userId}`, { method: 'DELETE' });

// Telegram (12.1)
export const getTelegramStatus = () => request('/api/profile/telegram');
export const createTelegramLink = () => request('/api/profile/telegram/link', { method: 'POST' });
export const unlinkTelegram = () => request('/api/profile/telegram', { method: 'DELETE' });

// Уведомления (раздел 12)
export const getNotifications = (unreadOnly = false) => request(`/api/notifications${query({ unreadOnly })}`);
export const readNotification = (id) => request(`/api/notifications/${id}/read`, { method: 'POST' });
export const readAllNotifications = () => request('/api/notifications/read-all', { method: 'POST' });
