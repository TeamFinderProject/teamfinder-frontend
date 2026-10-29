import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { applyToRole, getMatch, getProject } from '../api/endpoints.js';
import MatchBlock, { matchSummaryText } from '../components/MatchBlock.jsx';
import RequestState from '../components/RequestState.jsx';
import { ApplicationStatusBadge, ErrorNote, Modal, ProjectStateBadge, ProjectTypeBadge, Seats } from '../components/ui.jsx';
import { useApi } from '../hooks/useApi.js';
import { SKILL_LEVELS } from '../labels.js';

/** S-04. Страница проекта: роли, соответствие, отклик (UC-07, UC-08). */
export default function ProjectPage() {
  const { id } = useParams();
  const { status, data: project, error, reload } = useApi(() => getProject(id), [id]);
  const [matches, setMatches] = useState({});
  const [applyRole, setApplyRole] = useState(null);

  const isOwner = project?.myRelation === 'OWNER';
  const isMember = project?.myRelation === 'MEMBER';

  // Matching считается для каждой роли отдельно и только для кандидата.
  useEffect(() => {
    if (!project || isOwner) return;
    Promise.all(project.roles.map((r) => getMatch(project.id, r.id).then((m) => [r.id, m]).catch(() => [r.id, null]))).then(
      (pairs) => setMatches(Object.fromEntries(pairs)),
    );
  }, [project, isOwner]);

  if (status !== 'ready') return <RequestState status={status} error={error} onRetry={reload} />;

  const applicationFor = (roleId) => project.myApplications.find((a) => a.roleId === roleId);

  return (
    <section className="page">
      <div className="card">
        <div className="card__row">
          <h1 className="page__title page__title--inline">{project.title}</h1>
          <ProjectTypeBadge type={project.type} />
          <ProjectStateBadge state={project.state} />
          <span className="muted card__aside">Владелец: {project.owner.displayName}</span>
        </div>
        <p className="muted pre-line">{project.description}</p>

        {(isOwner || isMember) && (
          <div className="actions">
            {isOwner && (
              <>
                <Link className="btn btn--primary" to={`/projects/${project.id}/edit`}>
                  Управление проектом
                </Link>
                <Link className="btn" to={`/projects/${project.id}/applications`}>
                  Заявки проекта
                </Link>
              </>
            )}
            <Link className="btn" to={`/projects/${project.id}/team`}>
              Страница команды
            </Link>
          </div>
        )}
      </div>

      <h2 className="section-title">Роли проекта</h2>
      {project.roles.length === 0 && <div className="state state--empty">В проекте пока нет ролей</div>}

      <ul className="stack">
        {project.roles.map((role) => {
          const application = applicationFor(role.id);
          return (
            <li key={role.id} className="card">
              <div className="card__row">
                <h3 className="card__title">{role.title}</h3>
                <Seats occupied={role.occupied} capacity={role.capacity} />
                {role.title !== role.roleTypeName && <span className="muted small">{role.roleTypeName}</span>}
                <div className="card__aside">
                  {application && <ApplicationStatusBadge status={application.status} />}
                  {!isOwner && (
                    <ApplyButton
                      project={project}
                      role={role}
                      application={application}
                      isMember={isMember}
                      onApply={() => setApplyRole(role)}
                    />
                  )}
                </div>
              </div>
              {role.description && <p className="muted">{role.description}</p>}

              {isOwner || !matches[role.id] ? (
                <Requirements role={role} />
              ) : (
                <MatchBlock match={matches[role.id]} />
              )}
            </li>
          );
        })}
      </ul>

      {applyRole && (
        <ApplyModal
          project={project}
          role={applyRole}
          match={matches[applyRole.id]}
          onClose={() => setApplyRole(null)}
          onDone={() => {
            setApplyRole(null);
            reload();
          }}
        />
      )}
    </section>
  );
}

/**
 * Состояния кнопки «Откликнуться» (ui-design.md, S-04). Отключённая кнопка — только подсказка,
 * сервер проверяет те же условия сам (FR-UX-02).
 */
function ApplyButton({ project, role, application, isMember, onApply }) {
  let reason = null;
  if (project.state !== 'RECRUITING') reason = 'Набор закрыт';
  else if (isMember) reason = 'Вы в команде';
  else if (application) reason = 'Заявка подана';
  else if (role.isClosed) reason = 'Роль закрыта';
  else if (role.occupied >= role.capacity) reason = 'Мест нет';

  return (
    <button type="button" className="btn btn--primary" disabled={Boolean(reason)} onClick={onApply} title={reason ?? ''}>
      {reason ?? 'Откликнуться'}
    </button>
  );
}

function Requirements({ role }) {
  const required = role.requirements.filter((r) => r.type === 'REQUIRED');
  const nice = role.requirements.filter((r) => r.type === 'NICE_TO_HAVE');
  if (role.requirements.length === 0) return <p className="muted small">Требований к навыкам нет</p>;
  return (
    <p className="muted small">
      {required.length > 0 && (
        <>
          Обязательные:{' '}
          {required
            .map((r) => (r.minimumLevel ? `${r.skillName} (от «${SKILL_LEVELS[r.minimumLevel].toLowerCase()}»)` : r.skillName))
            .join(', ')}
        </>
      )}
      {required.length > 0 && nice.length > 0 && ' · '}
      {nice.length > 0 && <>Желательные: {nice.map((r) => r.skillName).join(', ')}</>}
    </p>
  );
}

const MESSAGE_LIMIT = 1000;

/** S-04a. Модальное окно отклика: роль, итог matching, комментарий. */
export function ApplyModal({ project, role, match, onClose, onDone }) {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const missing = match ? [...match.required, ...match.niceToHave].filter((i) => i.status !== 'MATCHED') : [];

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await applyToRole(project.id, role.id, message.trim());
      onDone();
    } catch (e) {
      setError(e);
      setBusy(false);
    }
  };

  return (
    <Modal title="Отклик на роль" onClose={onClose}>
      <form onSubmit={submit} className="modal__body">
        <p className="modal__subtitle">
          {project.title} · <strong>{role.title}</strong>
        </p>

        {match && match.profileHasSkills && (
          <div className="match-summary">
            <span>Соответствие: {matchSummaryText(match.summary)}</span>
            {missing.length > 0 && (
              <span className="muted small">
                Не хватает: {missing.map((i) => (i.status === 'LEVEL_TOO_LOW' ? `${i.skill} (уровень)` : i.skill)).join(', ')}
              </span>
            )}
          </div>
        )}
        {match && !match.profileHasSkills && (
          <div className="note">
            Заполните навыки в <Link to="/profile">профиле</Link>, чтобы владелец видел соответствие. Заявку можно
            отправить и сейчас.
          </div>
        )}

        <label className="field">
          <span className="field__label">Комментарий для владельца (необязательно)</span>
          <textarea
            className="input textarea"
            rows={4}
            maxLength={MESSAGE_LIMIT}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Расскажите коротко, почему вам интересна эта роль"
          />
          <span className="muted small field__counter">
            {message.length} / {MESSAGE_LIMIT}
          </span>
        </label>

        <ErrorNote error={error} />

        <div className="actions actions--end">
          <button type="button" className="btn" onClick={onClose}>
            Отмена
          </button>
          <button type="submit" className="btn btn--primary" disabled={busy}>
            {busy ? 'Отправка…' : 'Отправить заявку'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
