// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard'; // bạn sẽ tạo sau
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import Register from './pages/Register';
import LogoutButton from './components/LogoutButton';

function App() {
  const { user, loading } = useContext(AuthContext)!;

  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  return (
    <BrowserRouter>
      <LogoutButton />
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
        <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;