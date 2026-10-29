import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { FieldError } from '../components/ui.jsx';

/** S-01. Вход и регистрация (UC-01, UC-02). */
export default function LoginPage() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', confirm: '', displayName: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={location.state?.from || '/catalog'} replace />;

  const set = (field) => (event) => setForm((f) => ({ ...f, [field]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setError(null);
    if (mode === 'register' && form.password !== form.confirm) {
      setError({ message: 'Пароли не совпадают' });
      return;
    }
    setBusy(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
        navigate(location.state?.from || '/catalog', { replace: true });
      } else {
        await register(form.email, form.password, form.displayName);
        // UC-01: после регистрации пользователь сразу вошёл и попадает в профиль.
        navigate('/profile', { replace: true });
      }
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <form className="card auth__card" onSubmit={submit} noValidate>
        <h1 className="auth__brand">TeamFinder</h1>
        <div className="tabs" role="tablist">
          {[
            ['login', 'Вход'],
            ['register', 'Регистрация'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={mode === value}
              className={mode === value ? 'tabs__tab tabs__tab--active' : 'tabs__tab'}
              onClick={() => {
                setMode(value);
                setError(null);
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {mode === 'register' && (
          <label className="field">
            <span className="field__label">Имя</span>
            <input className="input" value={form.displayName} onChange={set('displayName')} autoComplete="name" />
            <FieldError error={error} field="displayName" />
          </label>
        )}
        <label className="field">
          <span className="field__label">Email</span>
          <input className="input" type="email" value={form.email} onChange={set('email')} autoComplete="email" />
          <FieldError error={error} field="email" />
        </label>
        <label className="field">
          <span className="field__label">Пароль</span>
          <input
            className="input"
            type="password"
            value={form.password}
            onChange={set('password')}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
          <FieldError error={error} field="password" />
        </label>
        {mode === 'register' && (
          <label className="field">
            <span className="field__label">Повторите пароль</span>
            <input className="input" type="password" value={form.confirm} onChange={set('confirm')} autoComplete="new-password" />
          </label>
        )}

        {/* FR-AUTH-07: при неверном входе — общее сообщение без указания поля. */}
        {error && !error.errors && <div className="note note--error">{error.message}</div>}

        <button type="submit" className="btn btn--primary btn--wide" disabled={busy}>
          {busy ? 'Подождите…' : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
        </button>
      </form>
    </div>
  );
}
