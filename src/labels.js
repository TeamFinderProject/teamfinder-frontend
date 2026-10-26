// Подписи для значений перечислений из контракта (раздел 13.4).

export const PROJECT_TYPES = {
  PET_PROJECT: 'Pet-проект',
  HACKATHON: 'Хакатон',
  STUDY_PROJECT: 'Учебный проект',
};

export const PROJECT_STATES = {
  DRAFT: 'Черновик',
  RECRUITING: 'Набор команды',
  IN_PROGRESS: 'Проект в работе',
  COMPLETED: 'Завершён',
  CANCELLED: 'Отменён',
};

export const APPLICATION_STATUSES = {
  PENDING: 'Ожидает решения',
  ACCEPTED: 'Принята',
  REJECTED: 'Отклонена',
  WITHDRAWN: 'Отозвана',
  CLOSED: 'Закрыта',
};

export const CLOSE_REASONS = {
  ACCEPTED_ANOTHER_ROLE: 'вы приняты на другую роль проекта',
  ROLE_FILLED: 'все места заняты',
  ROLE_CLOSED: 'набор на роль закрыт',
  RECRUITMENT_CLOSED: 'набор окончен',
  PROJECT_CANCELLED: 'проект отменён',
};

export const SKILL_LEVELS = {
  BEGINNER: 'Начинающий',
  INTERMEDIATE: 'Средний',
  ADVANCED: 'Продвинутый',
};

/** Допустимые переходы проекта для владельца (13.2 контракта). */
export const STATE_ACTIONS = {
  DRAFT: [
    { action: 'publish', label: 'Открыть набор', kind: 'primary' },
    { action: 'cancel', label: 'Отменить проект', kind: 'danger', confirm: 'Отменить черновик?' },
  ],
  RECRUITING: [
    {
      action: 'start',
      label: 'Перевести в работу',
      kind: 'primary',
      confirm: 'Набор закроется, все ожидающие заявки будут закрыты. Продолжить?',
    },
    {
      action: 'cancel',
      label: 'Отменить проект',
      kind: 'danger',
      confirm: 'Проект будет отменён, все ожидающие заявки закрыты. Продолжить?',
    },
  ],
  IN_PROGRESS: [
    { action: 'complete', label: 'Завершить проект', kind: 'primary', confirm: 'Завершить проект? Это необратимо.' },
    { action: 'cancel', label: 'Отменить проект', kind: 'danger', confirm: 'Отменить проект? Это необратимо.' },
  ],
  COMPLETED: [],
  CANCELLED: [],
};

export const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';

export const formatDateTime = (iso) =>
  iso
    ? new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    : '';
