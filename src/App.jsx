import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Layout from './components/Layout.jsx';
import LoginPage from './pages/auth/LoginPage.jsx';
import ChangePasswordPage from './pages/auth/ChangePasswordPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import OverviewPage from './pages/admin/OverviewPage.jsx';
import TimelinePage from './pages/admin/TimelinePage.jsx';
import OrgStructurePage from './pages/admin/OrgStructurePage.jsx';
import EmployeesPage from './pages/admin/EmployeesPage.jsx';
import AdminDocumentsPage from './pages/admin/AdminDocumentsPage.jsx';
import AdminReportsPage from './pages/admin/AdminReportsPage.jsx';
import EmployeeDocumentsPage from './pages/employee/EmployeeDocumentsPage.jsx';
import EmployeeReportsPage from './pages/employee/EmployeeReportsPage.jsx';
import EmployeePlanPage from './pages/employee/EmployeePlanPage.jsx';
import EmployeeMilestonesPage from './pages/employee/EmployeeMilestonesPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/change-password" element={<ChangePasswordPage />} />
        <Route element={<Layout />}>
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      {/* Admin — full, company-wide scope. */}
      <Route element={<ProtectedRoute role="admin" />}>
        <Route element={<Layout />}>
          <Route path="/admin/overview" element={<OverviewPage />} />
          <Route path="/admin/timeline" element={<TimelinePage />} />
          <Route path="/admin" element={<OrgStructurePage />} />
          <Route path="/admin/employees" element={<EmployeesPage />} />
          <Route path="/admin/documents" element={<AdminDocumentsPage />} />
          <Route path="/admin/reports" element={<AdminReportsPage />} />
        </Route>
      </Route>

      {/* Manager — same pages as admin, but every API call is transparently
          scoped server-side to the manager's own OrgUnit subtree. */}
      <Route element={<ProtectedRoute role="manager" />}>
        <Route element={<Layout />}>
          <Route path="/manager/overview" element={<OverviewPage />} />
          <Route path="/manager/timeline" element={<TimelinePage />} />
          <Route path="/manager" element={<OrgStructurePage />} />
          <Route path="/manager/employees" element={<EmployeesPage />} />
          <Route path="/manager/reports" element={<AdminReportsPage />} />
        </Route>
      </Route>

      {/* Employee + manager — personal reporting, identical for both roles. */}
      <Route element={<ProtectedRoute role={['employee', 'manager']} />}>
        <Route element={<Layout />}>
          <Route path="/documents" element={<EmployeeDocumentsPage />} />
          <Route path="/reports" element={<EmployeeReportsPage />} />
          <Route path="/plan" element={<EmployeePlanPage />} />
          <Route path="/milestones" element={<EmployeeMilestonesPage />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
