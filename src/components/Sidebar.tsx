import {
  type LucideIcon,
  LayoutDashboard,
  Receipt,
  Wallet,
  PiggyBank,
  Target,
  RefreshCw,
  Bell,
  User,
  Settings,
  FileText,
  LogOut,
  PieChart,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNotificationsContext } from '../context/NotificationContext';

export interface SidebarMenuItem {
  id: string;
  labelKey: string;
  path: string;
  icon: LucideIcon;
}

export const SIDEBAR_MENU: SidebarMenuItem[] = [
  { id: 'dashboard', icon: LayoutDashboard, labelKey: 'menu.dashboard', path: '/dashboard' },
  { id: 'transactions', icon: Receipt, labelKey: 'menu.transactions', path: '/transactions' },
  { id: 'wallets', icon: Wallet, labelKey: 'menu.wallets', path: '/wallets' },
  { id: 'budget', icon: PiggyBank, labelKey: 'menu.budget', path: '/budget' },
  { id: 'goals', icon: Target, labelKey: 'menu.goals', path: '/goals' },
  { id: 'recurring', icon: RefreshCw, labelKey: 'menu.recurring', path: '/recurring' },
  { id: 'notifications', icon: Bell, labelKey: 'menu.notifications', path: '/notifications' },
  { id: 'profile', icon: User, labelKey: 'menu.profile', path: '/profile' },
  { id: 'settings', icon: Settings, labelKey: 'menu.settings', path: '/settings' },
  { id: 'export', icon: FileText, labelKey: 'menu.export', path: '/export' },
];

interface SidebarProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
  onLogout: () => void;
  userName: string;
}

export default function Sidebar({ currentScreen, onNavigate, onLogout, userName }: SidebarProps) {
  const { t } = useTranslation('sidebar');
  const { unreadCount } = useNotificationsContext();
  
  const handleLogoutClick = () => {
    if (window.confirm(t('logoutConfirm'))) {
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
            <p className="text-foreground">{userName || t('user')}</p>
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
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${isActive
                  ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-800'
                  : 'text-foreground hover:bg-accent'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5" />
                  <span>{t(item.labelKey)}</span>
                </div>

                {item.id === 'notifications' && unreadCount > 0 && (
                  <span className="inline-flex min-w-[1.5rem] justify-center rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
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
          <span>{t('logout')}</span>
        </button>
      </div>
    </div>
  );
}
