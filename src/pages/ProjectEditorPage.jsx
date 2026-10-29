import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  addRole,
  changeProjectState,
  createProject,
  getProject,
  getRoleTypes,
  getSkills,
  updateProject,
} from '../api/endpoints.js';
import { useConfirm } from '../components/ConfirmProvider.jsx';
import RequestState from '../components/RequestState.jsx';
import RoleFields, { emptyRole, toRoleInput } from '../components/RoleFields.jsx';
import { ErrorNote, FieldError, ProjectStateBadge, Seats } from '../components/ui.jsx';
import { useApi } from '../hooks/useApi.js';
import { PROJECT_TYPES, STATE_ACTIONS } from '../labels.js';

function useDictionaries() {
  const [skills, setSkills] = useState([]);
  const [roleTypes, setRoleTypes] = useState([]);
  useEffect(() => {
    getSkills().then(setSkills).catch(() => {});
    getRoleTypes().then(setRoleTypes).catch(() => {});
  }, []);
  return { skills, roleTypes };
}

function ProjectFields({ form, setForm, error, typeLocked }) {
  const set = (field) => (event) => setForm((f) => ({ ...f, [field]: event.target.value }));
  return (
    <>
      <label className="field">
        <span className="field__label">Название</span>
        <input className="input" value={form.title} maxLength={200} onChange={set('title')} />
        <FieldError error={error} field="title" />
      </label>
      <label className="field">
        <span className="field__label">Описание</span>
        <textarea className="input textarea" rows={3} value={form.description} maxLength={5000} onChange={set('description')} />
        <FieldError error={error} field="description" />
      </label>
      <div className="field">
        <span className="field__label">
          Тип проекта {typeLocked && <span className="lock">меняется только в черновике</span>}
        </span>
        <div className="radio-group">
          {Object.entries(PROJECT_TYPES).map(([value, label]) => (
            <label key={value} className={form.type === value ? 'radio radio--active' : 'radio'}>
              <input
                type="radio"
                name="type"
                value={value}
                checked={form.type === value}
                disabled={typeLocked}
                onChange={set('type')}
              />
              {label}
            </label>
          ))}
        </div>
        <FieldError error={error} field="type" />
      </div>
      <label className="field">
        <span className="field__label">Внешний контакт команды (необязательно)</span>
        <input
          className="input"
          value={form.externalContactUrl}
          placeholder="https://t.me/..."
          onChange={set('externalContactUrl')}
        />
        <FieldError error={error} field="externalContactUrl" />
      </label>
    </>
  );
}

/** S-05, режим «Создание»: проект и роли одной формой, один запрос POST /api/projects (UC-04). */
export function ProjectCreatePage() {
  const navigate = useNavigate();
  const { skills, roleTypes } = useDictionaries();
  const [form, setForm] = useState({ title: '', description: '', type: 'PET_PROJECT', externalContactUrl: '' });
  const [roles, setRoles] = useState([emptyRole()]);
  const [publish, setPublish] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const created = await createProject({
        title: form.title.trim(),
        description: form.description.trim(),
        type: form.type,
        externalContactUrl: form.externalContactUrl.trim() || null,
        publish,
        roles: roles.map(toRoleInput),
      });
      navigate(`/projects/${created.id}`);
    } catch (e) {
      setError(e);
      setBusy(false);
    }
  };

  return (
    <form className="page" onSubmit={submit} noValidate>
      <h1 className="page__title">Новый проект</h1>

      <div className="card">
        <ProjectFields form={form} setForm={setForm} error={error} />
      </div>

      <div className="card">
        <div className="card__row">
          <h2 className="card__title">Роли проекта</h2>
          <span className="muted small">Кого вы ищете: роль из справочника, места и навыки</span>
          <button type="button" className="btn btn--primary card__aside" onClick={() => setRoles((r) => [...r, emptyRole()])}>
            + Добавить роль
          </button>
        </div>

        {roles.length === 0 && <p className="muted">Роли можно добавить и позже, но открыть набор без ролей нельзя.</p>}
        {roles.map((role, index) => (
          <div key={index} className="role-card">
            <div className="card__row">
              <strong>Роль {index + 1}</strong>
              <button
                type="button"
                className="link-button link-button--danger card__aside"
                onClick={() => setRoles((list) => list.filter((_, i) => i !== index))}
              >
                Удалить роль
              </button>
            </div>
            <RoleFields
              role={role}
              skills={skills}
              roleTypes={roleTypes}
              error={error}
              prefix={`roles[${index}]`}
              minCapacity={0}
              onChange={(next) => setRoles((list) => list.map((r, i) => (i === index ? next : r)))}
            />
          </div>
        ))}
      </div>

      <label className="check">
        <input type="checkbox" checked={publish} disabled={roles.length === 0} onChange={(e) => setPublish(e.target.checked)} />
        Сразу открыть набор (иначе проект сохранится черновиком)
      </label>

      <ErrorNote error={error} />

      <div className="actions">
        <button type="submit" className="btn btn--primary" disabled={busy}>
          {busy ? 'Создаём…' : 'Создать проект'}
        </button>
        <Link to="/projects/mine" className="btn">
          Отмена
        </Link>
      </div>
    </form>
  );
}

/** S-05, режим «Редактирование»: поля проекта, состояние, список ролей (UC-15, UC-16). */
export function ProjectEditPage() {
  const { id } = useParams();
  const { skills, roleTypes } = useDictionaries();
  const { status, data: project, error: loadError, reload } = useApi(() => getProject(id), [id]);
  const [form, setForm] = useState(null);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [newRole, setNewRole] = useState(null);
  const ask = useConfirm();

  useEffect(() => {
    if (project) {
      setForm({
        title: project.title,
        description: project.description,
        type: project.type,
        externalContactUrl: project.externalContactUrl ?? '',
      });
    }
  }, [project]);

  if (status !== 'ready' || !form) return <RequestState status={status} error={loadError} onRetry={reload} />;
  if (project.myRelation !== 'OWNER') return <div className="state state--error">Управлять проектом может только владелец</div>;

  const finished = project.state === 'COMPLETED' || project.state === 'CANCELLED';

  const save = async (event) => {
    event.preventDefault();
    setError(null);
    setSaved(false);
    try {
      await updateProject(project.id, {
        title: form.title.trim(),
        description: form.description.trim(),
        type: project.state === 'DRAFT' ? form.type : undefined,
        externalContactUrl: form.externalContactUrl.trim(), // "" — очистить контакт
      });
      setSaved(true);
      reload();
    } catch (e) {
      setError(e);
    }
  };

  const transition = async ({ action, label, kind, confirm }) => {
    if (confirm && !(await ask(confirm, { confirmLabel: label, danger: kind === 'danger' }))) return;
    setError(null);
    try {
      await changeProjectState(project.id, action);
      reload();
    } catch (e) {
      setError(e);
    }
  };

  const saveNewRole = async () => {
    setError(null);
    try {
      await addRole(project.id, toRoleInput(newRole));
      setNewRole(null);
      reload();
    } catch (e) {
      setError(e);
    }
  };

  return (
    <section className="page">
      <div className="page__header">
        <h1 className="page__title">Управление проектом</h1>
        <Link to={`/projects/${project.id}`}>К странице проекта</Link>
      </div>

      <form className="card" onSubmit={save} noValidate>
        <ProjectFields form={form} setForm={setForm} error={error} typeLocked={project.state !== 'DRAFT'} />
        <div className="actions">
          <button type="submit" className="btn btn--primary" disabled={finished}>
            Сохранить
          </button>
          {saved && <span className="text-ok small">Сохранено</span>}
        </div>
      </form>

      <div className="card">
        <div className="card__row">
          <span className="muted">Текущее состояние:</span>
          <ProjectStateBadge state={project.state} />
        </div>
        {STATE_ACTIONS[project.state].length > 0 ? (
          <>
            <span className="field__label">Доступные переходы</span>
            <div className="actions">
              {STATE_ACTIONS[project.state].map((t) => (
                <button
                  key={t.action}
                  type="button"
                  className={t.kind === 'danger' ? 'btn btn--danger' : 'btn btn--primary'}
                  onClick={() => transition(t)}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <p className="muted small">Перевод в работу и отмена закрывают все ожидающие заявки.</p>
          </>
        ) : (
          <p className="muted small">Проект в конечном состоянии, переходы недоступны.</p>
        )}
      </div>

      <ErrorNote error={error} />

      <div className="card">
        <div className="card__row">
          <h2 className="card__title">Роли проекта</h2>
          {!newRole && ['DRAFT', 'RECRUITING'].includes(project.state) && (
            <button type="button" className="btn btn--primary card__aside" onClick={() => setNewRole(emptyRole())}>
              + Добавить роль
            </button>
          )}
        </div>
        <ul className="rows">
          {project.roles.map((r) => (
            <li key={r.id} className="row">
              <strong>{r.title}</strong>
              <Seats occupied={r.occupied} capacity={r.capacity} />
              {r.isClosed && <span className="muted small">набор закрыт</span>}
              {!finished && (
                <Link className="row__action" to={`/projects/${project.id}/roles/${r.id}/edit`}>
                  Редактировать
                </Link>
              )}
            </li>
          ))}
        </ul>
        {newRole && (
          <div className="role-card">
            <RoleFields
              role={newRole}
              skills={skills}
              roleTypes={roleTypes}
              error={error}
              minCapacity={0}
              onChange={setNewRole}
            />
            <div className="actions">
              <button type="button" className="btn btn--primary" onClick={saveNewRole}>
                Сохранить роль
              </button>
              <button type="button" className="btn" onClick={() => setNewRole(null)}>
                Отмена
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
