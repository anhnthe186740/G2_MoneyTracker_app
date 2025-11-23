import {
  type LucideIcon,
  LayoutDashboard,
  Receipt,
  Wallet,
  PiggyBank,
  Target,
  RefreshCw,
  BarChart3,
  Bell,
  User,
  Settings,
  FileText,
  LogOut,
  PieChart,
} from 'lucide-react';

export interface SidebarMenuItem {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
}

export const SIDEBAR_MENU: SidebarMenuItem[] = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Tổng quan', path: '/dashboard' },
  { id: 'transactions', icon: Receipt, label: 'Giao dịch', path: '/transactions' },
  { id: 'accounts', icon: Wallet, label: 'Tài khoản', path: '/accounts' },
  { id: 'budget', icon: PiggyBank, label: 'Ngân sách', path: '/budget' },
  { id: 'goals', icon: Target, label: 'Mục tiêu', path: '/goals' },
  { id: 'recurring', icon: RefreshCw, label: 'Định kỳ', path: '/recurring' },
  { id: 'analytics', icon: BarChart3, label: 'Phân tích', path: '/analytics' },
  { id: 'notifications', icon: Bell, label: 'Thông báo', path: '/notifications' },
  { id: 'profile', icon: User, label: 'Hồ sơ', path: '/profile' },
  { id: 'settings', icon: Settings, label: 'Cài đặt', path: '/settings' },
  { id: 'export', icon: FileText, label: 'Xuất báo cáo', path: '/export' },
];

interface SidebarProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
  onLogout: () => void;
  userName: string;
}

export default function Sidebar({ currentScreen, onNavigate, onLogout, userName }: SidebarProps) {
  const handleLogoutClick = () => {
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất không?')) {
      onLogout();
    }
  };

  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-card border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <PieChart className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl text-foreground">MoneyTracker</span>
        </div>
      </div>

      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-400/50 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-blue-600 dark:text-blue-800" />
          </div>
          <div>
            <p className="text-foreground">{userName}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
          {SIDEBAR_MENU.map((item) => {
            const Icon = item.icon;
            const isActive = currentScreen === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-800'
                    : 'text-foreground hover:bg-accent'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <div className="p-4 border-t border-border">
        <button
          onClick={handleLogoutClick}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  );
}

