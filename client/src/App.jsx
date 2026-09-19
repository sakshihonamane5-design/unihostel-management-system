import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import AppLayout from './AppLayout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import StudentsPage from './pages/StudentsPage.jsx';
import HostelsPage from './pages/HostelsPage.jsx';
import ResidenciesPage from './pages/ResidenciesPage.jsx';
import MentorsPage from './pages/MentorsPage.jsx';
import LeavesPage from './pages/LeavesPage.jsx';
import GatePage from './pages/GatePage.jsx';
import ComplaintsPage from './pages/ComplaintsPage.jsx';
import NoticesPage from './pages/NoticesPage.jsx';
import MessPage from './pages/MessPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import AuditPage from './pages/AuditPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';

function Guard({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="p-8">Loading session…</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <p className="p-8">Loading UniHostel…</p>;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <RegisterPage />} />
      <Route
        path="/"
        element={
          <Guard>
            <AppLayout />
          </Guard>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="students" element={<Guard roles={['ADMIN']}><StudentsPage /></Guard>} />
        <Route path="hostels" element={<Guard roles={['ADMIN']}><HostelsPage /></Guard>} />
        <Route path="residencies" element={<Guard roles={['ADMIN']}><ResidenciesPage /></Guard>} />
        <Route path="mentors" element={<Guard roles={['ADMIN', 'MENTOR']}><MentorsPage /></Guard>} />
        <Route path="leaves" element={<LeavesPage />} />
        <Route path="gate" element={<Guard roles={['ADMIN', 'GATE_SECURITY']}><GatePage /></Guard>} />
        <Route path="complaints" element={<ComplaintsPage />} />
        <Route path="notices" element={<NoticesPage />} />
        <Route path="mess" element={<MessPage />} />
        <Route path="reports" element={<Guard roles={['ADMIN']}><ReportsPage /></Guard>} />
        <Route path="audit" element={<Guard roles={['ADMIN']}><AuditPage /></Guard>} />
        <Route path="profile" element={<Guard roles={['STUDENT', 'MENTOR']}><ProfilePage /></Guard>} />
      </Route>
      <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
    </Routes>
  );
}
