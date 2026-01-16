import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import CustomerHome from './pages/CustomerHome';
import AdminDashboard from './pages/AdminDashboard';
import TableSelection from './pages/TableSelection';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import CafeLayout from './components/CafeLayout';

import SuperAdminDashboard from './pages/SuperAdminDashboard';
import Maintenance from './pages/Maintenance';
import SubscriptionExpired from './pages/SubscriptionExpired';
import AccountFrozen from './pages/AccountFrozen';
import MaintenanceGuard from './components/MaintenanceGuard';

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <main>
        <Routes>
          <Route path="/maintenance" element={<Maintenance />} />
          <Route path="/subscription-expired" element={<SubscriptionExpired />} />
          <Route path="/account-frozen" element={<AccountFrozen />} />

          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />

          {/* Maintenance Guard wraps access to Cafe and Admin pages */}
          <Route element={<MaintenanceGuard />}>
            <Route path="/cafe/:cafeSlug" element={<CafeLayout />}>
              <Route index element={<CustomerHome />} />
              <Route path="table/:tableId" element={<CustomerHome />} />
            </Route>

            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Super Admin Route (Bypasses Maintenance Guard internally by role check or separate route structure) */}
          {/* Note: MaintenanceGuard logic also allows super_admin to pass through, but for clarity/safety we can keep it inside or outside. 
             The Guard has internal logic to allow super_admin. Placing it here makes sure even if enabled, they can access. */}
          <Route
            path="/super-admin"
            element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <SuperAdminDashboard />
              </ProtectedRoute>
            }
          />

        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;
