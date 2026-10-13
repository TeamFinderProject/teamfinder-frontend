import RequestState from '../components/RequestState.jsx';
import { getSkills } from '../api/client.js';
import { useApi } from '../hooks/useApi.js';

export default function SkillsPage() {
  const { status, data, error, reload } = useApi(getSkills, []);

  return (
    <section className="page">
      <h1 className="page__title">Навыки</h1>
      <p className="page__lead">
        Справочник навыков, которые можно указать в профиле и в требованиях к роли проекта.
      </p>

      <RequestState
        status={status}
        error={error}
        onRetry={reload}
        emptyText="Справочник навыков пуст"
      />

      {status === 'ready' && (
        <ul className="list">
          {data.map((skill) => (
            <li key={skill.id} className="list__item">
              <span className="list__name">{skill.name}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
