import { Link } from 'react-router-dom';
import { getMyProjects } from '../api/endpoints.js';
import RequestState from '../components/RequestState.jsx';
import { Badge, ProjectStateBadge, ProjectTypeBadge, Seats } from '../components/ui.jsx';
import { useApi } from '../hooks/useApi.js';

/** S-10. Мои проекты: где я владелец (включая черновики) или участник. У владельца — число новых заявок (BR-26). */
export default function MyProjectsPage() {
  const { status, data, error, reload } = useApi(getMyProjects, []);

  return (
    <section className="page">
      <div className="page__header">
        <h1 className="page__title">Мои проекты</h1>
        <Link to="/projects/new" className="btn btn--primary">
          + Создать проект
        </Link>
      </div>

      <RequestState status={status} error={error} onRetry={reload} emptyText="Вы пока не создали проект и не состоите в команде" />

      {status === 'ready' && (
        <ul className="stack">
          {data.map((p) => (
            <li key={p.id} className="card">
              <div className="card__row">
                <Link to={`/projects/${p.id}`} className="card__title">
                  {p.title}
                </Link>
                <ProjectTypeBadge type={p.type} />
                <ProjectStateBadge state={p.state} />
                <Badge>{p.myRelation === 'OWNER' ? 'Владелец' : 'Участник'}</Badge>
              </div>
              <div className="chips">
                {p.roles.map((r) => (
                  <span key={r.id} className="chip">
                    {r.title} <Seats occupied={r.occupied} capacity={r.capacity} />
                  </span>
                ))}
              </div>
              <div className="actions">
                {p.myRelation === 'OWNER' && (
                  <>
                    <Link to={`/projects/${p.id}/edit`}>Управление</Link>
                    <Link to={`/projects/${p.id}/applications`}>
                      Заявки{p.pendingApplications > 0 ? ` (новых: ${p.pendingApplications})` : ''}
                    </Link>
                  </>
                )}
                {p.state !== 'DRAFT' && <Link to={`/projects/${p.id}/team`}>Команда</Link>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
