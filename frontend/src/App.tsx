import { Route, BrowserRouter as Router, Routes } from "react-router";
import AppLayout from "./layout/AppLayout";
import Home from "./pages/Dashboard/Home";
import SignUp from "./pages/auth/SignUp";
import SignIn from "./pages/auth/SignIn";
import Transactions from "./pages/Transactions/Transactions";
import Budgets from "./pages/Budgets/Budgets";
import Accounts from "./pages/Accounts/Accounts";
import Reports from "./pages/Reports/Reports";
import RecurringPayments from "./pages/RecurringPayments/RecurringPayments";
import Notifications from "./pages/Notifications/Notifications";
import Profile from "./pages/UserProfile/Profile";
import Settings from "./pages/Settings/Settings";
import PublicOnlyRoute from "./routes/PublicOnlyRoute";
import ProtectedRoute from "./routes/ProtectedRoute";
import PermissionRoute from "./routes/PermissionRoute";
import PersonalAreaRoute from "./routes/PersonalAreaRoute";
import SetPassword from "./pages/auth/SetPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import VerifyEmail from "./pages/auth/VerifyEmailForm";
import Forbidden from "./pages/Errors/Forbidden";
import AdminDashboardPage from "./pages/Admin/DashboardPage";
import AdminUsersPage from "./pages/Admin/UsersPage";
import AdminRolesPage from "./pages/Admin/RolesPage";
import AdminAuditLogsPage from "./pages/Admin/AuditLogsPage";
import Categories from "./pages/Categories/Categories";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/set-password" element={<SetPassword />} />

          <Route element={<AppLayout />}>
            <Route element={<PersonalAreaRoute />}>
              <Route path="/" element={<Home />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/budgets" element={<Budgets />} />
              <Route path="/accounts" element={<Accounts />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/recurring-payments" element={<RecurringPayments />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/notifications" element={<Notifications />} />
            </Route>

            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />

            <Route element={<PermissionRoute anyOf={["users:read", "roles:manage", "audit:read"]} />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
            </Route>
            <Route element={<PermissionRoute permission="users:read" />}>
              <Route path="/admin/users" element={<AdminUsersPage />} />
            </Route>
            <Route element={<PermissionRoute permission="roles:manage" />}>
              <Route path="/admin/roles" element={<AdminRolesPage />} />
            </Route>
            <Route element={<PermissionRoute permission="audit:read" />}>
              <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
            </Route>

            <Route path="/403" element={<Forbidden />} />
          </Route>
        </Route>

        <Route element={<PublicOnlyRoute />}>
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
        </Route>

        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    </Router>
  );
}