import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { AuthProvider } from './context/AuthProvider';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import DashboardEmploye from './pages/DashboardEmploye';
import CreateTicket from './pages/CreateTicket';
import TicketDetail from './pages/TicketDetail';
import DashboardAdmin from './pages/DashboardAdmin';
import Register from './pages/Register';
import Profile from './pages/Profile';



function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <DashboardAdmin />
              </ProtectedRoute>
            } 
          />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardEmploye />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/tickets/new" 
            element={
              <ProtectedRoute>
                <CreateTicket />
              </ProtectedRoute>
            } 
          />
          
          {/* La route du détail du ticket DOIT être ici, AVANT la route * */}
          <Route 
            path="/tickets/:id" 
            element={
              <ProtectedRoute>
                <TicketDetail />
              </ProtectedRoute>
            } 
          />
          
          {/* La route par défaut (404 -> Login) DOIT être en toute dernière position */}
          <Route path="*" element={<Navigate to="/login" replace />} />

          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>

    
  );
}