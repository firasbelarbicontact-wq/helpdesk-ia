import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { AuthProvider } from './context/AuthProvider';
import { useAuth } from './context/AuthContext';
import type { Role } from './types';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import DashboardEmploye from './pages/DashboardEmploye';
import CreateTicket from './pages/CreateTicket';
import TicketDetail from './pages/TicketDetail';
import Profile from './pages/Profile';
import DashboardAdmin from './pages/DashboardAdmin';
import AdminTechnicians from './pages/AdminTechnicians';

function ProtectedRoute({ children, allowedRoles }: { children: ReactNode; allowedRoles?: Role[] }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/dashboard'} replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Routes Publiques */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Routes Protégées (Employés & Techniciens) */}
          <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['EMPLOYE', 'TECHNICIAN']}><DashboardEmploye /></ProtectedRoute>} />
          <Route path="/tickets/new" element={<ProtectedRoute allowedRoles={['EMPLOYE']}><CreateTicket /></ProtectedRoute>} />
          <Route path="/tickets/:id" element={<ProtectedRoute><TicketDetail /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          {/* Routes Protégées (Admin) */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><DashboardAdmin /></ProtectedRoute>} />
          <Route path="/admin/technicians" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminTechnicians /></ProtectedRoute>} />

          {/* Route par défaut (Redirection vers Login) */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
