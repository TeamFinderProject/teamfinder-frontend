import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCatalog, getRoleTypes, getSkills } from '../api/endpoints.js';
import RequestState from '../components/RequestState.jsx';
import { ProjectStateBadge, ProjectTypeBadge, Seats } from '../components/ui.jsx';
import { useApi } from '../hooks/useApi.js';
import { PROJECT_TYPES } from '../labels.js';

const EMPTY_FILTERS = { q: '', type: '', roleTypeId: '', skillId: '', openOnly: true };
const PAGE_SIZE = 10;

/** S-03. Каталог проектов с фильтрами (UC-06). Черновики backend в каталог не отдаёт. */
export default function CatalogPage() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [applied, setApplied] = useState(EMPTY_FILTERS);
  const [skills, setSkills] = useState([]);
  const [roleTypes, setRoleTypes] = useState([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    getSkills().then(setSkills).catch(() => {});
    getRoleTypes().then(setRoleTypes).catch(() => {});
  }, []);

  const { status, data, error, reload } = useApi(
    () => getCatalog({ ...applied, page, pageSize: PAGE_SIZE }),
    [applied, page],
  );
  const pages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  // Новый фильтр — снова с первой страницы.
  const apply = (next) => {
    setApplied(next);
    setPage(1);
  };
  const set = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    const next = { ...filters, [field]: value };
    setFilters(next);
    if (field !== 'q') apply(next);
  };

  return (
    <section className="page">
      <div className="page__header">
        <h1 className="page__title">Каталог проектов</h1>
        <Link to="/projects/new" className="btn btn--primary">
          + Создать проект
        </Link>
      </div>

      <form
        className="card filters"
        onSubmit={(e) => {
          e.preventDefault();
          apply(filters);
        }}
      >
        <input className="input filters__search" placeholder="Поиск по названию и описанию" value={filters.q} onChange={set('q')} />
        <select className="input" value={filters.roleTypeId} onChange={set('roleTypeId')} aria-label="Роль">
          <option value="">Роль</option>
          {roleTypes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <select className="input" value={filters.skillId} onChange={set('skillId')} aria-label="Навык">
          <option value="">Навык</option>
          {skills.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select className="input" value={filters.type} onChange={set('type')} aria-label="Тип проекта">
          <option value="">Тип проекта</option>
          {Object.entries(PROJECT_TYPES).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <label className="check">
          <input type="checkbox" checked={filters.openOnly} onChange={set('openOnly')} />
          Только открытый набор
        </label>
        <button
          type="button"
          className="link-button filters__reset"
          onClick={() => {
            setFilters(EMPTY_FILTERS);
            apply(EMPTY_FILTERS);
          }}
        >
          Сбросить
        </button>
      </form>

      <RequestState
        status={status}
        error={error}
        onRetry={reload}
        emptyText="Под фильтры ничего не подошло — попробуйте изменить условия"
      />

      {status === 'ready' && (
        <ul className="stack">
          {data.items.map((p) => (
            <li key={p.id} className="card card--link">
              <Link to={`/projects/${p.id}`} className="card__cover-link" aria-label={p.title} />
              <div className="card__row">
                <h2 className="card__title">{p.title}</h2>
                <ProjectTypeBadge type={p.type} />
                <ProjectStateBadge state={p.state} />
              </div>
              <p className="muted">{p.description}</p>
              <div className="chips">
                {p.roles.map((r) => (
                  <span key={r.id} className={r.isClosed ? 'chip chip--muted' : 'chip'}>
                    {r.title} <Seats occupied={r.occupied} capacity={r.capacity} />
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
      {status === 'ready' && pages > 1 && (
        <nav className="pager" aria-label="Страницы каталога">
          <button type="button" className="btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            ← Назад
          </button>
          <span className="muted small">
            Страница {page} из {pages} · всего проектов: {data.total}
          </span>
          <button type="button" className="btn" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
            Вперёд →
          </button>
        </nav>
      )}
    </section>
  );
}
