// src/components/LogoutButton.tsx
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';

export default function LogoutButton() {
  const { logout, user } = useContext(AuthContext)!;
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <button
      onClick={handleLogout}
      className="fixed top-4 right-4 z-50 bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-6 rounded-xl shadow-lg flex items-center gap-2 transition"
    >
      <LogOut className="w-5 h-5" />
      Đăng xuất ({user.fullName || user.username})
    </button>
  );
}