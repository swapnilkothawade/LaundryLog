import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import JoinHouseholdPage from './pages/JoinHouseholdPage';
import DashboardPage from './pages/DashboardPage';
import NewEntryPage from './pages/NewEntryPage';
import EntryDetailPage from './pages/EntryDetailPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import './index.css';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p style={{ color: 'var(--color-text-muted)' }}>Loading...</p>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function HouseholdRoute({ children }) {
  const { user, userProfile, loading } = useAuth();
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (!userProfile?.householdId) return <Navigate to="/setup" replace />;
  return children;
}

function AppRoutes() {
  const { user, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p style={{ color: 'var(--color-text-muted)' }}>Loading LaundryLog...</p>
      </div>
    );
  }

  return (
    <>
      <div className="app-bg" />
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <LoginPage />}
        />
        <Route
          path="/setup"
          element={
            <ProtectedRoute>
              {userProfile?.householdId ? (
                <Navigate to="/" replace />
              ) : (
                <JoinHouseholdPage />
              )}
            </ProtectedRoute>
          }
        />
        <Route
          path="/"
          element={
            <HouseholdRoute>
              <DashboardPage />
            </HouseholdRoute>
          }
        />
        <Route
          path="/new-entry"
          element={
            <HouseholdRoute>
              <NewEntryPage />
            </HouseholdRoute>
          }
        />
        <Route
          path="/entry/:entryId"
          element={
            <HouseholdRoute>
              <EntryDetailPage />
            </HouseholdRoute>
          }
        />
        <Route
          path="/history"
          element={
            <HouseholdRoute>
              <HistoryPage />
            </HouseholdRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <HouseholdRoute>
              <SettingsPage />
            </HouseholdRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Navbar />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
