import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <section className="page">
      <h1 className="page__title">Страница не найдена</h1>
      <p className="page__lead">
        Такого маршрута в приложении нет. <Link to="/">Вернуться на главную</Link>.
      </p>
    </section>
  );
}
