import { createContext, useContext, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import * as client from '../api/client.js';

const AuthContext = createContext(null);

/**
 * Сессия пользователя. При старте приложения пробуем восстановить вход по refresh-cookie:
 * access token живёт только в памяти и после перезагрузки страницы теряется.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsubscribe = client.onSessionChange(setUser);
    client.refreshSession().finally(() => setReady(true));
    return unsubscribe;
  }, []);

  const value = {
    user,
    ready,
    login: client.login,
    register: client.register,
    logout: client.logout,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

/** Пускает на экран только вошедшего пользователя, иначе отправляет на /login и запоминает, куда шёл. */
export function RequireAuth({ children }) {
  const { user, ready } = useAuth();
  const location = useLocation();

  if (!ready) {
    return (
      <div className="state state--loading">
        <span className="spinner" aria-hidden="true" />
        <span>Загрузка…</span>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}
