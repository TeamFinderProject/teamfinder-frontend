import { useEffect, useState } from 'react';
import { getProfile, getRoleTypes, getSkills, saveProfile } from '../api/endpoints.js';
import RequestState from '../components/RequestState.jsx';
import TelegramBlock from '../components/TelegramBlock.jsx';
import { ErrorNote, FieldError } from '../components/ui.jsx';
import { useApi } from '../hooks/useApi.js';
import { SKILL_LEVELS } from '../labels.js';

/** S-02. Профиль: о себе, интересующие роли, навыки с уровнями (UC-03). Сохраняется целиком PUT /api/profile. */
export default function ProfilePage() {
  const { status, data, error: loadError, reload } = useApi(getProfile, []);
  const [skills, setSkills] = useState([]);
  const [roleTypes, setRoleTypes] = useState([]);
  const [form, setForm] = useState(null);
  const [newSkill, setNewSkill] = useState({ skillId: '', level: 'BEGINNER' });
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getSkills().then(setSkills).catch(() => {});
    getRoleTypes().then(setRoleTypes).catch(() => {});
  }, []);

  useEffect(() => {
    if (data) {
      setForm({
        displayName: data.displayName,
        bio: data.bio ?? '',
        githubUrl: data.githubUrl ?? '',
        portfolioUrl: data.portfolioUrl ?? '',
        interestedRoleTypeIds: data.interestedRoleTypes.map((r) => r.id),
        skills: data.skills.map((s) => ({ skillId: s.skillId, level: s.level })),
      });
    }
  }, [data]);

  if (status !== 'ready' || !form) return <RequestState status={status} error={loadError} onRetry={reload} />;

  const set = (field) => (event) => {
    setSaved(false);
    setForm((f) => ({ ...f, [field]: event.target.value }));
  };
  const skillName = (id) => skills.find((s) => s.id === id)?.name ?? `#${id}`;
  const used = new Set(form.skills.map((s) => s.skillId));

  const toggleRole = (id) =>
    setForm((f) => ({
      ...f,
      interestedRoleTypeIds: f.interestedRoleTypeIds.includes(id)
        ? f.interestedRoleTypeIds.filter((x) => x !== id)
        : [...f.interestedRoleTypeIds, id],
    }));

  const addSkill = () => {
    if (!newSkill.skillId) return;
    // RULE-PROF-02: уже добавленный навык не предлагается повторно.
    setForm((f) => ({ ...f, skills: [...f.skills, { skillId: Number(newSkill.skillId), level: newSkill.level }] }));
    setNewSkill({ skillId: '', level: 'BEGINNER' });
  };

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      await saveProfile({
        displayName: form.displayName.trim(),
        bio: form.bio.trim() || null,
        githubUrl: form.githubUrl.trim() || null,
        portfolioUrl: form.portfolioUrl.trim() || null,
        interestedRoleTypeIds: form.interestedRoleTypeIds,
        skills: form.skills,
      });
      setSaved(true);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="page" onSubmit={submit} noValidate>
      <h1 className="page__title">Профиль</h1>

      <div className="card">
        <label className="field">
          <span className="field__label">Имя</span>
          <input className="input" value={form.displayName} onChange={set('displayName')} />
          <FieldError error={error} field="displayName" />
        </label>
        <label className="field">
          <span className="field__label">О себе</span>
          <textarea className="input textarea" rows={2} value={form.bio} onChange={set('bio')} />
        </label>
        <div className="grid-2">
          <label className="field">
            <span className="field__label">GitHub (необязательно)</span>
            <input className="input" value={form.githubUrl} placeholder="https://github.com/username" onChange={set('githubUrl')} />
            <FieldError error={error} field="githubUrl" />
          </label>
          <label className="field">
            <span className="field__label">Портфолио (необязательно)</span>
            <input className="input" value={form.portfolioUrl} placeholder="https://..." onChange={set('portfolioUrl')} />
            <FieldError error={error} field="portfolioUrl" />
          </label>
        </div>
      </div>

      <div className="card">
        <h2 className="card__title">Интересующие роли</h2>
        <div className="chips">
          {roleTypes.map((r) => {
            const active = form.interestedRoleTypeIds.includes(r.id);
            return (
              <button
                key={r.id}
                type="button"
                className={active ? 'chip chip--toggle chip--active' : 'chip chip--toggle'}
                aria-pressed={active}
                onClick={() => toggleRole(r.id)}
              >
                {r.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="card">
        <h2 className="card__title">Навыки</h2>
        {form.skills.length === 0 && (
          <p className="muted">Добавьте навыки — по ним считается соответствие ролям проектов.</p>
        )}
        <ul className="rows">
          {form.skills.map((s) => (
            <li key={s.skillId} className="row">
              <strong>{skillName(s.skillId)}</strong>
              <select
                className="input row__action"
                value={s.level}
                aria-label={`Уровень ${skillName(s.skillId)}`}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    skills: f.skills.map((x) => (x.skillId === s.skillId ? { ...x, level: e.target.value } : x)),
                  }))
                }
              >
                {Object.entries(SKILL_LEVELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="chip__remove"
                aria-label={`Удалить ${skillName(s.skillId)}`}
                onClick={() => setForm((f) => ({ ...f, skills: f.skills.filter((x) => x.skillId !== s.skillId) }))}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
        <div className="inline-form">
          <select
            className="input"
            value={newSkill.skillId}
            onChange={(e) => setNewSkill((n) => ({ ...n, skillId: e.target.value }))}
            aria-label="Навык из справочника"
          >
            <option value="">Навык из справочника</option>
            {skills
              .filter((s) => !used.has(s.id))
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
          </select>
          <select
            className="input"
            value={newSkill.level}
            onChange={(e) => setNewSkill((n) => ({ ...n, level: e.target.value }))}
            aria-label="Уровень"
          >
            {Object.entries(SKILL_LEVELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <button type="button" className="btn" onClick={addSkill} disabled={!newSkill.skillId}>
            Добавить
          </button>
        </div>
      </div>

      <TelegramBlock />

      <ErrorNote error={error} />
      <div className="actions">
        <button type="submit" className="btn btn--primary" disabled={busy}>
          {busy ? 'Сохраняем…' : 'Сохранить'}
        </button>
        {saved && <span className="text-ok small">Профиль сохранён</span>}
      </div>
    </form>
  );
}
