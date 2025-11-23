// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import SidebarLayout from './pages/SidebarLayout';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Accounts from './pages/Accounts';
import Budget from './pages/Budget';
import Goals from './pages/Goals';
import Recurring from './pages/Recurring';
import Analytics from './pages/Analytics';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import ExportReports from './pages/ExportReports';

function App() {
  const { user, loading } = useContext(AuthContext)!;

  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  return (
    <BrowserRouter>
      <Routes>
        {/* Landing Page - công khai, không cần đăng nhập */}
        <Route path="/" element={<LandingPage />} />
        {/* Dashboard - yêu cầu đăng nhập */}
        <Route
          element={user ? <SidebarLayout /> : <Navigate to="/login" replace />}
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/budget" element={<Budget />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/recurring" element={<Recurring />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/export" element={<ExportReports />} />
        </Route>
        {/* Login - redirect nếu đã đăng nhập */}
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
        {/* Register - redirect nếu đã đăng nhập */}
        <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
        {/* Fallback */}
        <Route path="*" element={<Navigate to={user ? '/dashboard' : '/'} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;