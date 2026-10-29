import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, RequireAuth } from './auth/AuthContext.jsx';
import { ConfirmProvider } from './components/ConfirmProvider.jsx';
import Layout from './components/Layout.jsx';
import { MyApplicationsPage, ProjectApplicationsPage } from './pages/ApplicationsPage.jsx';
import CatalogPage from './pages/CatalogPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import MyProjectsPage from './pages/MyProjectsPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import { ProjectCreatePage, ProjectEditPage } from './pages/ProjectEditorPage.jsx';
import ProjectPage from './pages/ProjectPage.jsx';
import RoleEditPage from './pages/RoleEditPage.jsx';
import TeamPage from './pages/TeamPage.jsx';

// Экраны из ui-design.md (teamfinder-docs). Все, кроме входа, требуют авторизации.
const PROTECTED = [
  { path: '/catalog', element: <CatalogPage /> }, // S-03
  { path: '/profile', element: <ProfilePage /> }, // S-02
  { path: '/projects/new', element: <ProjectCreatePage /> }, // S-05 создание
  { path: '/projects/mine', element: <MyProjectsPage /> },
  { path: '/projects/:id', element: <ProjectPage /> }, // S-04 + S-04a
  { path: '/projects/:id/edit', element: <ProjectEditPage /> }, // S-05 редактирование
  { path: '/projects/:id/roles/:roleId/edit', element: <RoleEditPage /> }, // S-06
  { path: '/projects/:id/applications', element: <ProjectApplicationsPage /> }, // S-07 владелец
  { path: '/projects/:id/team', element: <TeamPage /> }, // S-08
  { path: '/applications', element: <MyApplicationsPage /> }, // S-07 кандидат
];

export default function App() {
  return (
    <AuthProvider>
      <ConfirmProvider>
        <Layout>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<Navigate to="/catalog" replace />} />
            {PROTECTED.map(({ path, element }) => (
              <Route key={path} path={path} element={<RequireAuth>{element}</RequireAuth>} />
            ))}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Layout>
      </ConfirmProvider>
    </AuthProvider>
  );
}
