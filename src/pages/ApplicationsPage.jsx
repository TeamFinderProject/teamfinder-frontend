import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  acceptApplication,
  getMyApplications,
  getProject,
  getProjectApplications,
  rejectApplication,
  withdrawApplication,
} from '../api/endpoints.js';
import { matchSummaryText } from '../components/MatchBlock.jsx';
import { useConfirm } from '../components/ConfirmProvider.jsx';
import RequestState from '../components/RequestState.jsx';
import { ApplicationStatusBadge, ErrorNote, Seats } from '../components/ui.jsx';
import { useApi } from '../hooks/useApi.js';
import { SKILL_LEVELS, formatDate } from '../labels.js';

/** S-07, режим «Мои заявки» (UC-09). Отозвать можно только заявку в статусе PENDING (RULE-APP-03). */
export function MyApplicationsPage() {
  const { status, data, error, reload } = useApi(getMyApplications, []);
  const [actionError, setActionError] = useState(null);
  const ask = useConfirm();

  const withdraw = async (id) => {
    if (!(await ask('Отозвать заявку? Повторно подать заявку на эту роль будет нельзя.', { confirmLabel: 'Отозвать', danger: true }))) return;
    setActionError(null);
    try {
      await withdrawApplication(id);
      reload();
    } catch (e) {
      setActionError(e);
      reload();
    }
  };

  return (
    <section className="page">
      <h1 className="page__title">Мои заявки</h1>
      <ErrorNote error={actionError} />
      <RequestState status={status} error={error} onRetry={reload} emptyText="Вы ещё не подавали заявок. Найдите проект в каталоге" />

      {status === 'ready' && (
        <ul className="rows card">
          {data.map((a) => (
            <li key={a.id} className="row">
              <Link to={`/projects/${a.project.id}`} className="row__title">
                {a.project.title}
              </Link>
              <span className="muted">{a.role.title}</span>
              <span className="muted small">{formatDate(a.createdAt)}</span>
              <span className="row__action">
                <ApplicationStatusBadge status={a.status} closeReason={a.closeReason} />
                {a.status === 'ACCEPTED' && <Link to={`/projects/${a.project.id}/team`}>Команда</Link>}
                {/* FR-UX-01: недоступное действие отключается, а не прячется. */}
                <button
                  type="button"
                  className="btn"
                  disabled={!a.canWithdraw}
                  title={a.canWithdraw ? '' : 'Отозвать можно только заявку, ожидающую решения'}
                  onClick={() => withdraw(a.id)}
                >
                  Отозвать
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** S-07, режим «Заявки проекта» для владельца (UC-10, UC-11, UC-12). */
export function ProjectApplicationsPage() {
  const { id } = useParams();
  const [onlyPending, setOnlyPending] = useState(true);
  const project = useApi(() => getProject(id), [id]);
  const apps = useApi(() => getProjectApplications(id, { status: onlyPending ? 'PENDING' : '' }), [id, onlyPending]);
  const [actionError, setActionError] = useState(null);
  const ask = useConfirm();

  const act = async (fn, applicationId, confirmText) => {
    if (confirmText && !(await ask(confirmText, { confirmLabel: 'Принять' }))) return;
    setActionError(null);
    try {
      await fn(applicationId);
    } catch (e) {
      // Например, ROLE_FULL: место занял другой кандидат — показываем причину и обновляем данные.
      setActionError(e);
    }
    apps.reload();
    project.reload();
  };

  if (project.status !== 'ready') return <RequestState status={project.status} error={project.error} onRetry={project.reload} />;

  const roles = project.data.roles;
  const byRole = roles
    .map((role) => ({ role, items: (apps.data ?? []).filter((a) => a.roleId === role.id) }))
    .filter((g) => g.items.length > 0);
  const recruiting = project.data.state === 'RECRUITING';

  return (
    <section className="page">
      <div className="page__header">
        <h1 className="page__title">
          Заявки проекта <span className="muted page__subtitle">{project.data.title}</span>
        </h1>
        <label className="check">
          <input type="checkbox" checked={onlyPending} onChange={(e) => setOnlyPending(e.target.checked)} />
          Только ожидающие
        </label>
      </div>

      <ErrorNote error={actionError} />
      <RequestState status={apps.status} error={apps.error} onRetry={apps.reload} emptyText="Заявок нет" />

      {apps.status === 'ready' &&
        byRole.map(({ role, items }) => {
          const full = role.occupied >= role.capacity;
          return (
            <div key={role.id} className="card">
              <div className="card__row">
                <h2 className="card__title">{role.title}</h2>
                <Seats occupied={role.occupied} capacity={role.capacity} />
                <span className="muted small card__aside">
                  Новых заявок: {items.filter((a) => a.status === 'PENDING').length}
                </span>
              </div>
              {items.map((a) => (
                <article key={a.id} className="applicant">
                  <div className="card__row">
                    <strong>{a.candidate.displayName}</strong>
                    <ApplicationStatusBadge status={a.status} closeReason={a.closeReason} />
                    {a.status === 'PENDING' && (
                      <span className="card__aside actions">
                        <button
                          type="button"
                          className="btn btn--primary"
                          disabled={!recruiting || full || role.isClosed}
                          title={full ? 'Мест нет' : ''}
                          onClick={() =>
                            act(acceptApplication, a.id, `Принять ${a.candidate.displayName} в команду? Это действие необратимо.`)
                          }
                        >
                          Принять
                        </button>
                        <button type="button" className="btn btn--danger" onClick={() => act(rejectApplication, a.id)}>
                          Отклонить
                        </button>
                      </span>
                    )}
                  </div>
                  {a.candidate.bio && <p className="muted pre-line">{a.candidate.bio}</p>}
                  {a.candidate.interestedRoleTypes.length > 0 && (
                    <p className="muted small">
                      Интересуют роли: {a.candidate.interestedRoleTypes.map((r) => r.name).join(', ')}
                    </p>
                  )}
                  {a.candidate.skills.length > 0 && (
                    <p className="muted small">
                      {a.candidate.skills.map((s) => `${s.name} — ${SKILL_LEVELS[s.level].toLowerCase()}`).join(' · ')}
                    </p>
                  )}
                  {a.message && <blockquote className="quote">«{a.message}»</blockquote>}
                  <p className="small">
                    <strong>Соответствие:</strong>{' '}
                    <span className={a.match.requiredMatched === a.match.requiredTotal ? 'text-ok' : ''}>
                      {matchSummaryText(a.match)}
                    </span>
                    {a.candidate.githubUrl && (
                      <>
                        {' · '}
                        <a href={a.candidate.githubUrl} target="_blank" rel="noreferrer">
                          GitHub
                        </a>
                      </>
                    )}
                  </p>
                </article>
              ))}
            </div>
          );
        })}
    </section>
  );
}
