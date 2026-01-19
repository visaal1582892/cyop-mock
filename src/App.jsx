import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import UserProfile from './pages/UserProfile';
import Planner from './pages/Planner';
import Admin from './pages/Admin';
import Login from './pages/Login';
import AddPatient from './pages/AddPatient';
import ManagePatients from './pages/ManagePatients';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/*" element={
            <AppLayout>
              <Toaster position="top-center" />
              <Routes>
                {/* User Routes */}
                <Route path="/" element={
                  <ProtectedRoute allowedRoles={['user']}>
                    <UserProfile />
                  </ProtectedRoute>
                } />
                <Route path="/planner" element={
                  <ProtectedRoute allowedRoles={['user']}>
                    <Planner />
                  </ProtectedRoute>
                } />
                <Route path="/add-patient" element={
                  <ProtectedRoute allowedRoles={['user']}>
                    <AddPatient />
                  </ProtectedRoute>
                } />
                <Route path="/manage-patients" element={
                  <ProtectedRoute allowedRoles={['user']}>
                    <ManagePatients />
                  </ProtectedRoute>
                } />

                {/* Admin Routes */}
                <Route path="/admin" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Admin />
                  </ProtectedRoute>
                } />
              </Routes>
            </AppLayout>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
