import { useState } from 'react';
import { SKILL_LEVELS } from '../labels.js';
import { FieldError } from './ui.jsx';

export const emptyRole = () => ({ roleTypeId: '', title: '', description: '', capacity: 1, requirements: [] });

/** Приводит роль из формы к телу RoleInput контракта (7.3). */
export function toRoleInput(role) {
  return {
    roleTypeId: Number(role.roleTypeId) || 0,
    title: role.title.trim() || null,
    description: role.description.trim() || null,
    capacity: Number(role.capacity) || 0,
    requirements: role.requirements.map((r) => ({
      skillId: Number(r.skillId),
      type: r.type,
      minimumLevel: r.minimumLevel || null,
    })),
  };
}

/** Из роли API — в состояние формы. */
export function fromRole(role) {
  return {
    roleTypeId: String(role.roleTypeId),
    title: role.title === role.roleTypeName ? '' : role.title,
    description: role.description ?? '',
    capacity: role.capacity,
    requirements: role.requirements.map((r) => ({
      skillId: String(r.skillId),
      type: r.type,
      minimumLevel: r.minimumLevel ?? '',
    })),
  };
}

/**
 * Поля одной роли проекта: тип из справочника (RULE-ROLE-04), уточнение названия, описание, места,
 * обязательные и желательные навыки. Навык выбирается один раз на роль (RULE-ROLE-02).
 * prefix — путь поля для ошибок сервера, например "roles[1]".
 */
export default function RoleFields({ role, onChange, skills, roleTypes, locked = false, error, prefix = '', minCapacity = 1 }) {
  const set = (field, value) => onChange({ ...role, [field]: value });
  const path = (field) => (prefix ? `${prefix}.${field}` : field);

  return (
    <div className="role-fields">
      <div className="grid-2">
        <label className="field">
          <span className="field__label">
            Тип роли {locked && <span className="lock">заблокировано</span>}
          </span>
          <select
            className="input"
            value={role.roleTypeId}
            disabled={locked}
            onChange={(e) => set('roleTypeId', e.target.value)}
          >
            <option value="">Выберите из справочника</option>
            {roleTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <FieldError error={error} field={path('roleTypeId')} />
        </label>
        <label className="field">
          <span className="field__label">Уточнение названия (необязательно)</span>
          <input
            className="input"
            value={role.title}
            maxLength={150}
            placeholder="Например, «Backend на Go»"
            onChange={(e) => set('title', e.target.value)}
          />
          <FieldError error={error} field={path('title')} />
        </label>
      </div>

      <label className="field">
        <span className="field__label">Описание</span>
        <input
          className="input"
          value={role.description}
          maxLength={2000}
          placeholder="Чем будет заниматься участник"
          onChange={(e) => set('description', e.target.value)}
        />
      </label>

      <label className="field field--narrow">
        <span className="field__label">Количество мест</span>
        <div className="stepper">
          <button
            type="button"
            className="btn"
            aria-label="Меньше"
            disabled={Number(role.capacity) <= Math.max(1, minCapacity)}
            onClick={() => set('capacity', Number(role.capacity) - 1)}
          >
            −
          </button>
          <input
            className="input stepper__value"
            type="number"
            min={Math.max(1, minCapacity)}
            max={50}
            value={role.capacity}
            onChange={(e) => set('capacity', e.target.value)}
          />
          <button type="button" className="btn" aria-label="Больше" onClick={() => set('capacity', Number(role.capacity) + 1)}>
            +
          </button>
          {minCapacity > 0 && (
            <span className="muted small">занято {minCapacity} — меньше сделать нельзя</span>
          )}
        </div>
        <FieldError error={error} field={path('capacity')} />
      </label>

      <RequirementsEditor
        title="Обязательные навыки"
        type="REQUIRED"
        role={role}
        skills={skills}
        locked={locked}
        onChange={(requirements) => set('requirements', requirements)}
      />
      <RequirementsEditor
        title="Желательные навыки"
        type="NICE_TO_HAVE"
        role={role}
        skills={skills}
        locked={locked}
        onChange={(requirements) => set('requirements', requirements)}
      />
      <FieldError error={error} field={path('requirements')} />
    </div>
  );
}

function RequirementsEditor({ title, type, role, skills, locked, onChange }) {
  const [skillId, setSkillId] = useState('');
  const [level, setLevel] = useState('');
  const items = role.requirements.filter((r) => r.type === type);
  const used = new Set(role.requirements.map((r) => r.skillId));
  const skillName = (id) => skills.find((s) => String(s.id) === String(id))?.name ?? `#${id}`;

  const add = () => {
    if (!skillId) return;
    onChange([...role.requirements, { skillId, type, minimumLevel: type === 'REQUIRED' ? level : '' }]);
    setSkillId('');
    setLevel('');
  };

  return (
    <div className="requirements">
      <span className="field__label">
        {title} {locked && <span className="lock">заблокировано</span>}
      </span>
      <div className="chips">
        {items.length === 0 && <span className="muted small">Не указаны</span>}
        {items.map((r) => (
          <span key={r.skillId} className="chip">
            {skillName(r.skillId)}
            {r.minimumLevel && <span className="muted"> · от «{SKILL_LEVELS[r.minimumLevel].toLowerCase()}»</span>}
            {!locked && (
              <button
                type="button"
                className="chip__remove"
                aria-label={`Убрать ${skillName(r.skillId)}`}
                onClick={() => onChange(role.requirements.filter((x) => x.skillId !== r.skillId))}
              >
                ×
              </button>
            )}
          </span>
        ))}
      </div>
      {!locked && (
        <div className="inline-form">
          <select className="input" value={skillId} onChange={(e) => setSkillId(e.target.value)} aria-label="Навык">
            <option value="">Навык из справочника</option>
            {skills
              .filter((s) => !used.has(String(s.id)))
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
          </select>
          {type === 'REQUIRED' && (
            <select className="input" value={level} onChange={(e) => setLevel(e.target.value)} aria-label="Минимальный уровень">
              <option value="">Мин. уровень — любой</option>
              {Object.entries(SKILL_LEVELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          )}
          <button type="button" className="btn" onClick={add} disabled={!skillId}>
            Добавить
          </button>
        </div>
      )}
    </div>
  );
}
