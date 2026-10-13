import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import HomePage from './pages/HomePage.jsx';
import SkillsPage from './pages/SkillsPage.jsx';
import StubPage from './pages/StubPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import { SCREENS } from './pages/screens.js';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="skills" element={<SkillsPage />} />

        {SCREENS.map((s) => (
          <Route
            key={s.path}
            path={s.path.replace(/^\//, '')}
            element={
              <StubPage title={s.title} summary={s.summary} cases={s.cases} />
            }
          />
        ))}

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
