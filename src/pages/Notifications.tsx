import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNotificationsContext } from '../context/NotificationContext';
import type { Notification } from '../types';
import { formatDateTime } from '../utils/format';
import { Bell, Check, AlertCircle, Target, RefreshCw, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export default function Notifications() {
  const auth = useContext(AuthContext);
  if (!auth) {
    throw new Error('AuthContext must be used inside AuthProvider');
  }
  const { user } = auth;

  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
  } = useNotificationsContext();

  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  // Icon cho từng loại thông báo
  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'WARNING': return <AlertCircle className="w-6 h-6 text-orange-600" />;
      case 'SUCCESS': return <Target className="w-6 h-6 text-green-600" />;
      case 'REMINDER': return <RefreshCw className="w-6 h-6 text-blue-600" />;
      case 'INFO': return <TrendingUp className="w-6 h-6 text-purple-600" />;
      default: return <Bell className="w-6 h-6 text-gray-600" />;
    }
  };

  // Màu nền icon
  const getBgColor = (type: Notification['type']) => {
    switch (type) {
      case 'WARNING': return 'bg-orange-50';
      case 'SUCCESS': return 'bg-green-50';
      case 'REMINDER': return 'bg-blue-50';
      case 'INFO': return 'bg-purple-50';
      default: return 'bg-gray-50';
    }
  };

  const handleMarkAsReadClick = async (id: string) => {
    await markAsRead(id);
    toast.success('Đã đánh dấu là đã đọc');
  };

  const handleMarkAllAsReadClick = async () => {
    if (unreadCount === 0) return;
    await markAllAsRead();
    toast.success('Đã đánh dấu tất cả là đã đọc');
  };

  // Lọc theo trạng thái
  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.is_read;
    if (filter === 'read') return n.is_read;
    return true;
  });

  if (loading) {
    return <div className="flex justify-center items-center h-64">Đang tải thông báo...</div>;
  }

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-gray-900">Thông báo</h1>
        <p className="text-gray-600">
          Bạn có {unreadCount} thông báo chưa đọc
        </p>
      </header>

      {/* Filter */}
      <div className="bg-white p-4 rounded-xl shadow-md border border-gray-200 flex items-center gap-4">
        <label className="text-gray-700">Lọc thông báo:</label>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="w-48 border border-gray-300 rounded-lg p-2 bg-white"
        >
          <option value="all">Tất cả</option>
          <option value="unread">Chưa đọc ({unreadCount})</option>
          <option value="read">Đã đọc ({notifications.length - unreadCount})</option>
        </select>

        <button
          onClick={handleMarkAllAsReadClick}
          disabled={unreadCount === 0}
          className="ml-auto bg-primary text-white py-2 px-4 rounded-lg disabled:opacity-50 hover:bg-indigo-600 transition"
        >
          <Check className="w-4 h-4 inline mr-2" />
          Đánh dấu tất cả đã đọc
        </button>
      </div>

      {/* Notification list */}
      {filteredNotifications.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl shadow-md border border-gray-200">
          <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Không có thông báo nào</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white p-6 rounded-xl shadow-md border ${
                !notification.is_read ? 'border-l-4 border-l-primary' : 'border-gray-200'
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
                          !notification.is_read ? 'text-gray-900' : 'text-gray-600'
                        }`}
                      >
                        {notification.title}
                      </h3>

                      {!notification.is_read && (
                        <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded mt-1">
                          Mới
                        </span>
                      )}
                    </div>

                    {!notification.is_read && (
                      <button
                        onClick={() => handleMarkAsReadClick(notification.id)}
                        className="text-gray-500 hover:text-gray-700 flex items-center"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Đánh dấu đã đọc
                      </button>
                    )}
                  </div>

                  <p className="text-gray-600 mb-3">{notification.message}</p>

                  <p className="text-sm text-gray-400">
                    {formatDateTime(notification.created_at)}
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
