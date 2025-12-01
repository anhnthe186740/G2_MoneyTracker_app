import {
  createContext,
  useContext as useReactContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import api from '../services/api';
import type { Notification } from '../types';
import { AuthContext } from './AuthContext';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const auth = useReactContext(AuthContext);
  if (!auth) {
    throw new Error('NotificationProvider must be used inside AuthProvider');
  }
  const { user } = auth;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const res = await api.get<Notification[]>(
        `/notifications?user_id=${user.id}`
      );

      const sorted = res.data.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setNotifications(sorted);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // short polling
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchNotifications();

    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}`, { is_read: true });
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (error) {
      console.error('Error markAsRead:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
      await Promise.all(
        unreadIds.map(id => api.patch(`/notifications/${id}`, { is_read: true }))
      );
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Error markAllAsRead:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        refresh: fetchNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationsContext = () => {
  const ctx = useReactContext(NotificationContext);
  if (!ctx) {
    throw new Error(
      'useNotificationsContext must be used inside NotificationProvider'
    );
  }
  return ctx;
};
