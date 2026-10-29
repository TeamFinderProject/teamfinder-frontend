import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <section className="page">
      <h1 className="page__title">Страница не найдена</h1>
      <p className="muted">
        Такого адреса в приложении нет. <Link to="/catalog">Перейти в каталог</Link>.
      </p>
    </section>
  );
}
