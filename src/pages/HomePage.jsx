import { Link } from 'react-router-dom';
import ServerStatus from '../components/ServerStatus.jsx';
import { SCREENS } from './screens.js';

const href = (path) => path.replace(':id', '1').replace(':roleId', '1');

export default function HomePage() {
  return (
    <section className="page">
      <h1 className="page__title">TeamFinder</h1>
      <p className="page__lead">
        Поиск участников и формирование команд для pet-проектов, хакатонов и учебных проектов.
      </p>
      <ServerStatus />

      <h2 className="section-title">Разделы</h2>
      <ul className="list">
        {SCREENS.map((s) => (
          <li key={s.path} className="list__item list__item--stacked">
            <Link to={href(s.path)} className="list__name">
              {s.title}
            </Link>
            <span className="list__desc">{s.summary}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
