import { NavLink, Outlet } from 'react-router-dom';

const NAV = [
  { to: '/catalog', label: 'Каталог' },
  { to: '/applications', label: 'Мои заявки' },
  { to: '/projects', label: 'Мои проекты' },
  { to: '/profile', label: 'Профиль' },
  { to: '/skills', label: 'Навыки' },
];

export default function Layout() {
  return (
    <div className="app">
      <header className="topbar">
        <NavLink to="/" className="brand">
          TeamFinder
        </NavLink>
        <nav className="nav">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? 'nav__link nav__link--active' : 'nav__link')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
