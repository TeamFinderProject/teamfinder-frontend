import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { closeRole, deleteRole, getProject, getRoleTypes, getSkills, updateRole } from '../api/endpoints.js';
import { useConfirm } from '../components/ConfirmProvider.jsx';
import RequestState from '../components/RequestState.jsx';
import RoleFields, { fromRole, toRoleInput } from '../components/RoleFields.jsx';
import { ErrorNote } from '../components/ui.jsx';
import { useApi } from '../hooks/useApi.js';

/** S-06. Редактирование роли (UC-05). После первой заявки тип и навыки заблокированы (RULE-ROLE-06). */
export default function RoleEditPage() {
  const { id, roleId } = useParams();
  const navigate = useNavigate();
  const { status, data: project, error: loadError, reload } = useApi(() => getProject(id), [id]);
  const [skills, setSkills] = useState([]);
  const [roleTypes, setRoleTypes] = useState([]);
  const [form, setForm] = useState(null);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const ask = useConfirm();

  const role = project?.roles.find((r) => String(r.id) === String(roleId));

  useEffect(() => {
    getSkills().then(setSkills).catch(() => {});
    getRoleTypes().then(setRoleTypes).catch(() => {});
  }, []);
  useEffect(() => {
    if (role) setForm(fromRole(role));
  }, [role]);

  if (status !== 'ready') return <RequestState status={status} error={loadError} onRetry={reload} />;
  if (!role || !form) return <div className="state state--error">Роль не найдена</div>;

  const locked = role.requirementsLocked;

  const save = async () => {
    setError(null);
    setSaved(false);
    const input = toRoleInput(form);
    const changes = { title: form.title.trim(), description: form.description.trim(), capacity: input.capacity };
    if (!locked) {
      changes.roleTypeId = input.roleTypeId;
      changes.requirements = input.requirements;
    }
    try {
      await updateRole(project.id, role.id, changes);
      setSaved(true);
      reload();
    } catch (e) {
      setError(e);
    }
  };

  const close = async () => {
    if (!(await ask('Закрыть набор на роль? Ожидающие заявки на неё будут закрыты, новые подать будет нельзя.', { confirmLabel: 'Закрыть роль', danger: true }))) return;
    try {
      await closeRole(project.id, role.id);
      reload();
    } catch (e) {
      setError(e);
    }
  };

  const remove = async () => {
    if (!(await ask('Удалить роль? На неё ещё никто не подавал заявок, история не потеряется.', { confirmLabel: 'Удалить', danger: true }))) return;
    try {
      await deleteRole(project.id, role.id);
      navigate(`/projects/${project.id}/edit`);
    } catch (e) {
      setError(e);
    }
  };

  return (
    <section className="page">
      <div className="page__header">
        <h1 className="page__title">
          Роль проекта <span className="muted page__subtitle">{project.title} · {role.title}</span>
        </h1>
        <Link to={`/projects/${project.id}/edit`}>К проекту</Link>
      </div>

      {locked && (
        <div className="note note--warn">
          На роль уже есть заявки: тип роли и требования к навыкам изменить нельзя — кандидаты подавались на эти
          требования. Чтобы изменить требования, закройте роль и создайте новую.
        </div>
      )}
      {role.isClosed && <div className="note">Набор на эту роль закрыт.</div>}

      <div className="card">
        <RoleFields
          role={form}
          skills={skills}
          roleTypes={roleTypes}
          locked={locked}
          error={error}
          minCapacity={role.occupied}
          onChange={setForm}
        />
      </div>

      <ErrorNote error={error} />

      <div className="actions">
        <button type="button" className="btn btn--primary" onClick={save}>
          Сохранить
        </button>
        {/* FR-UX-01: недоступное действие отключаем и подписываем, а не прячем. */}
        <button type="button" className="btn" disabled={role.isClosed} onClick={close}>
          {role.isClosed ? 'Роль закрыта' : 'Закрыть роль'}
        </button>
        <button
          type="button"
          className="btn btn--danger"
          disabled={locked}
          title={locked ? 'На роль уже подавали заявки — её можно только закрыть' : ''}
          onClick={remove}
        >
          Удалить роль
        </button>
        {locked && <span className="muted small">Удалить нельзя: на роль уже подавали заявки</span>}
        {saved && <span className="text-ok small">Сохранено</span>}
      </div>
    </section>
  );
}
