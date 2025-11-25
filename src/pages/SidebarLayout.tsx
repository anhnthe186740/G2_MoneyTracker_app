import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useContext, useMemo } from 'react';
import Sidebar, { SIDEBAR_MENU } from '../components/Sidebar';
import { AuthContext } from '../context/AuthContext';

export default function SidebarLayout() {
  const auth = useContext(AuthContext);
  if (!auth) {
    throw new Error('SidebarLayout must be used within AuthProvider');
  }
  const { user, logout } = auth;
  const location = useLocation();
  const navigate = useNavigate();

  const currentScreen = useMemo(() => {
    const found = SIDEBAR_MENU.find((item) =>
      location.pathname === '/'
        ? item.path === '/dashboard'
        : location.pathname.startsWith(item.path),
    );
    return found?.id ?? 'dashboard';
  }, [location.pathname]);

  const handleNavigate = (screen: string) => {
    const target = SIDEBAR_MENU.find((item) => item.id === screen);
    if (target && target.path !== location.pathname) {
      navigate(target.path);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        onLogout={logout}
        userName={user?.fullName ?? 'Người dùng'}
      />

      <main className="ml-64 flex-1 bg-muted/10">
        <div className="min-h-screen p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

