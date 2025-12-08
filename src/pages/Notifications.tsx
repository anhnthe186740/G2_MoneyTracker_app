import { useState, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../context/AuthContext';
import { useNotificationsContext } from '../context/NotificationContext';
import type { Notification } from '../types';
import { formatDateTime } from '../utils/format';
import { Bell, Check, AlertCircle, Target, RefreshCw, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import Pagination from '../components/common/Pagination';

export default function Notifications() {
  const { t, i18n } = useTranslation('notifications');
  const auth = useContext(AuthContext);
  if (!auth) {
    throw new Error('AuthContext must be used inside AuthProvider');
  }

  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
  } = useNotificationsContext();

  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Get current locale for date formatting
  const currentLocale = i18n.language?.startsWith('en') ? 'en' : 'vi';

  // Icon for each notification type with aria-label for accessibility
  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'WARNING': 
        return (
          <AlertCircle 
            className="w-6 h-6 text-orange-600" 
            aria-label={t('ariaLabels.warningIcon')}
          />
        );
      case 'SUCCESS': 
        return (
          <Target 
            className="w-6 h-6 text-green-600" 
            aria-label={t('ariaLabels.successIcon')}
          />
        );
      case 'REMINDER': 
        return (
          <RefreshCw 
            className="w-6 h-6 text-blue-600" 
            aria-label={t('ariaLabels.reminderIcon')}
          />
        );
      case 'INFO': 
        return (
          <TrendingUp 
            className="w-6 h-6 text-purple-600" 
            aria-label={t('ariaLabels.infoIcon')}
          />
        );
      default: 
        return <Bell className="w-6 h-6 text-gray-600" />;
    }
  };

  // Background color for icon
  const getBgColor = (type: Notification['type']) => {
    switch (type) {
      case 'WARNING': return 'bg-orange-50 dark:bg-orange-900/30';
      case 'SUCCESS': return 'bg-green-50 dark:bg-green-900/30';
      case 'REMINDER': return 'bg-blue-50 dark:bg-blue-900/30';
      case 'INFO': return 'bg-purple-50 dark:bg-purple-900/30';
      default: return 'bg-gray-50 dark:bg-slate-800';
    }
  };

  const handleMarkAsReadClick = async (id: string) => {
    await markAsRead(id);
    toast.success(t('toast.markedRead'));
  };

  const handleMarkAllAsReadClick = async () => {
    if (unreadCount === 0) return;
    await markAllAsRead();
    toast.success(t('toast.markedAllRead'));
  };

  // Filter by status
  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      if (filter === 'unread') return !n.is_read;
      if (filter === 'read') return n.is_read;
      return true;
    });
  }, [notifications, filter]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedNotifications = filteredNotifications.slice(startIndex, endIndex);

  // Reset to page 1 when filter changes
  const handleFilterChange = (newFilter: 'all' | 'unread' | 'read') => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">{t('loading')}</div>;
  }

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
        <p className="text-muted-foreground">
          {t('subtitle', { count: unreadCount })}
        </p>
      </header>

      {/* Filter */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-md border border-gray-200 dark:border-slate-800 flex items-center gap-4">
        <label className="text-gray-700 dark:text-gray-200">{t('filter.label')}</label>

        <select
          value={filter}
          onChange={(e) => handleFilterChange(e.target.value as 'all' | 'unread' | 'read')}
          className="w-48 border border-gray-300 dark:border-slate-700 rounded-lg p-2 bg-white dark:bg-slate-900 dark:text-foreground"
        >
          <option value="all">{t('filter.all')}</option>
          <option value="unread">{t('filter.unread', { count: unreadCount })}</option>
          <option value="read">{t('filter.read', { count: notifications.length - unreadCount })}</option>
        </select>

        <button
          onClick={handleMarkAllAsReadClick}
          disabled={unreadCount === 0}
          aria-label={t('ariaLabels.markAllAsReadButton')}
          className="ml-auto bg-primary text-white py-2 px-4 rounded-lg disabled:opacity-50 hover:bg-indigo-600 transition"
        >
          <Check className="w-4 h-4 inline mr-2" />
          {t('actions.markAllRead')}
        </button>
      </div>

      {/* Pagination - Top */}
      {filteredNotifications.length > 0 && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          itemsPerPage={itemsPerPage}
          totalItems={filteredNotifications.length}
          showInfo={true}
        />
      )}

      {/* Notification list */}
      {filteredNotifications.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 text-center rounded-xl shadow-md border border-gray-200 dark:border-slate-800">
          <Bell className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">{t('empty')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white dark:bg-slate-900 p-6 rounded-xl shadow-md border ${
                  !notification.is_read ? 'border-l-4 border-l-primary' : 'border-gray-200 dark:border-slate-800'
                }`}
              >
                <div className="flex gap-4">
                  {/* Icon */}
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${getBgColor(
                      notification.type
                    )}`}
                  >
                    {getIcon(notification.type)}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3
                          className={`text-lg font-semibold ${
                            !notification.is_read ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'
                          }`}
                        >
                          {notification.title}
                        </h3>

                        {!notification.is_read && (
                          <span className="inline-block px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded mt-1">
                            {t('new')}
                          </span>
                        )}
                      </div>

                      {!notification.is_read && (
                        <button
                          onClick={() => handleMarkAsReadClick(notification.id)}
                          aria-label={t('ariaLabels.markAsReadButton')}
                          className="text-gray-500 hover:text-gray-700 flex items-center"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          {t('actions.markRead')}
                        </button>
                      )}
                    </div>

                    <p className="text-gray-600 dark:text-gray-300 mb-3">{notification.message}</p>

                    <p className="text-sm text-gray-400 dark:text-gray-500">
                      {formatDateTime(notification.created_at, currentLocale)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
      )}
    </section>
  );
}
