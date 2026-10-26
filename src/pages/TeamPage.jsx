import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { getTeam, leaveTeam, removeMember } from '../api/endpoints.js';
import { useConfirm } from '../components/ConfirmProvider.jsx';
import RequestState from '../components/RequestState.jsx';
import { ErrorNote, ProjectStateBadge, ProjectTypeBadge } from '../components/ui.jsx';
import { useApi } from '../hooks/useApi.js';

/** S-08. Команда проекта (UC-13, UC-14). Контакт видят только владелец и участники (RULE-TEAM-07). */
export default function TeamPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { status, data: team, error, reload } = useApi(() => getTeam(id), [id]);
  const [actionError, setActionError] = useState(null);
  const [copied, setCopied] = useState(false);
  const ask = useConfirm();

  if (status !== 'ready') return <RequestState status={status} error={error} onRetry={reload} />;

  const isOwner = team.owner.id === user.id;
  const finished = team.project.state === 'COMPLETED' || team.project.state === 'CANCELLED';

  const remove = async (member) => {
    if (!(await ask(`Исключить ${member.displayName} из команды? Место в роли освободится.`, { confirmLabel: 'Исключить', danger: true }))) return;
    try {
      await removeMember(team.project.id, member.userId);
      reload();
    } catch (e) {
      setActionError(e);
    }
  };

  const leave = async () => {
    if (!(await ask('Выйти из команды? После выхода доступ к контакту команды пропадёт, вернуться в этот проект будет нельзя.', { confirmLabel: 'Выйти', danger: true }))) return;
    try {
      await leaveTeam(team.project.id);
      navigate('/applications');
    } catch (e) {
      setActionError(e);
    }
  };

  const copy = async () => {
    await navigator.clipboard?.writeText(team.externalContactUrl);
    setCopied(true);
  };

  return (
    <section className="page">
      <div className="page__header">
        <h1 className="page__title">Команда проекта</h1>
        <Link to={`/projects/${team.project.id}`}>К проекту</Link>
      </div>

      <div className="card">
        <div className="card__row">
          <h2 className="card__title">{team.project.title}</h2>
          <ProjectTypeBadge type={team.project.type} />
          <ProjectStateBadge state={team.project.state} />
          <span className="muted card__aside">Владелец: {team.owner.displayName}</span>
        </div>
      </div>

      <ErrorNote error={actionError} />

      <div className="card">
        <h2 className="card__title">Состав команды</h2>
        <ul className="rows">
          <li className="row">
            <span className="avatar" aria-hidden="true" />
            <strong>{team.owner.displayName}</strong>
            <span className="muted">Владелец проекта</span>
            <span className="badge badge--accent row__action">Не занимает место в наборе</span>
          </li>
          {team.members.map((m) => (
            <li key={m.membershipId} className="row">
              <span className="avatar" aria-hidden="true" />
              <strong>{m.displayName}</strong>
              <span className="muted">{m.roleTitle}</span>
              {isOwner && (
                <button
                  type="button"
                  className="btn btn--danger row__action"
                  disabled={finished}
                  title={finished ? 'Проект завершён или отменён' : ''}
                  onClick={() => remove(m)}
                >
                  Исключить
                </button>
              )}
            </li>
          ))}
        </ul>
        {team.members.length === 0 && <p className="muted">В команде пока никого нет</p>}
      </div>

      <div className="card">
        <h2 className="card__title">Связь команды</h2>
        {team.externalContactUrl ? (
          <div className="inline-form">
            <a className="input contact" href={team.externalContactUrl} target="_blank" rel="noreferrer">
              {team.externalContactUrl}
            </a>
            <button type="button" className="btn" onClick={copy}>
              {copied ? 'Скопировано' : 'Копировать'}
            </button>
          </div>
        ) : (
          <p className="muted">Владелец пока не указал контакт команды.</p>
        )}
        <p className="muted small">Ссылку видят только владелец и действующие участники. Встроенного чата нет.</p>
      </div>

      {!isOwner && (
        <div className="actions">
          <button type="button" className="btn btn--danger" disabled={finished} onClick={leave}>
            Выйти из команды
          </button>
          {finished && <span className="muted small">Проект завершён или отменён — состав команды не меняется</span>}
        </div>
      )}
    </section>
  );
}
