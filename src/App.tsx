// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard'; 
import LandingPage from './pages/LandingPage';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import Register from './pages/Register';
import LogoutButton from './components/LogoutButton';
import Profile from './pages/Profile'
function App() {
  const { user, loading } = useContext(AuthContext)!;

  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  return (
    <BrowserRouter>
      {/* Chỉ hiển thị LogoutButton khi đã đăng nhập */}
      {user && <LogoutButton />}
      <Routes>
        <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
        {/* Landing Page - công khai, không cần đăng nhập */}
        <Route path="/" element={<LandingPage />} />
        {/* Dashboard - yêu cầu đăng nhập */}
        <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
        {/* Login - redirect nếu đã đăng nhập */}
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
        {/* Register - redirect nếu đã đăng nhập */}
        <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;