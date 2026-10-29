import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import NotificationBell from './NotificationBell.jsx';

const NAV = [
  { to: '/catalog', label: 'Каталог' },
  { to: '/applications', label: 'Мои заявки' },
  { to: '/projects/mine', label: 'Мои проекты' },
  { to: '/profile', label: 'Профиль' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="app">
      {user && (
        <header className="topbar">
          <NavLink to="/catalog" className="brand">
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
          <NotificationBell />
          <button type="button" className="nav__link nav__button" onClick={handleLogout}>
            Выход
          </button>
        </header>
      )}
      <main className="main">{children}</main>
    </div>
  );
}
