import api from './api';
import i18n from '../language/i18next/config';

// Format số tiền - sẽ sử dụng locale mặc định của trình duyệt
const formatCurrency = (amount: number): string => {
  return amount.toLocaleString();
};

// Helper function để dịch text với namespace notifications
const t = (key: string, options?: Record<string, string | number>): string => {
  return i18n.t(key, { ns: 'notifications', ...options });
};

// Interface cho notification settings
interface NotificationSettings {
  inactivityReminders?: boolean;
  recurringTransactionReminders?: boolean;
  goalDeadlineReminders?: boolean;
  budgetAlerts?: boolean;
  lowBalanceAlerts?: boolean;
  largeTransactionAlerts?: boolean;
  goalProgressAlerts?: boolean;
  goalCompletionAlerts?: boolean;
  monthlySummaryAlerts?: boolean;
}

// Lấy notification settings từ localStorage
const getNotificationSettings = (): NotificationSettings => {
  if (typeof window === 'undefined') {
    // Default: tất cả đều bật
    return {
      inactivityReminders: true,
      recurringTransactionReminders: true,
      goalDeadlineReminders: true,
      budgetAlerts: true,
      lowBalanceAlerts: true,
      largeTransactionAlerts: true,
      goalProgressAlerts: true,
      goalCompletionAlerts: true,
      monthlySummaryAlerts: true,
    };
  }

  try {
    const saved = localStorage.getItem('app-settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.notifications) {
        return parsed.notifications;
      }
    }
  } catch (error) {
    console.error('Error reading notification settings:', error);
  }

  // Default: tất cả đều bật
  return {
    inactivityReminders: true,
    recurringTransactionReminders: true,
    goalDeadlineReminders: true,
    budgetAlerts: true,
    lowBalanceAlerts: true,
    largeTransactionAlerts: true,
    goalProgressAlerts: true,
    goalCompletionAlerts: true,
    monthlySummaryAlerts: true,
  };
};

// Kiểm tra xem loại thông báo có được bật không
const isNotificationEnabled = (settingKey: keyof NotificationSettings): boolean => {
  const settings = getNotificationSettings();
  return settings[settingKey] !== false; // Mặc định là true nếu không có trong settings
};

// Hàm gửi thông báo
export const sendNotification = async (
  userId: string | number,
  type: 'WARNING' | 'SUCCESS' | 'INFO' | 'REMINDER',
  title: string,
  message: string
) => {
  try {
    await api.post('/notifications', {
      user_id: typeof userId === 'number' ? userId : Number(userId),
      type: type,
      title: title,
      message: message,
      is_read: false,
      created_at: new Date().toISOString(),
    });
    console.log(`✅ Thông báo đã được gửi cho user ${userId}: ${title}`);
  } catch (error) {
    console.error('❌ Error sending notification:', error);
    throw error; // Throw để caller có thể handle
  }
};

// Kiểm tra giao dịch chưa ghi chép (cải thiện logic để gửi đúng các mốc thời gian)
export const checkInactivity = async (
  userId: string | number,
  lastTransactionDate: string | null | undefined
) => {
  // Kiểm tra settings
  if (!isNotificationEnabled('inactivityReminders')) {
    return;
  }

  if (!lastTransactionDate) {
    // Nếu chưa có giao dịch nào, không gửi thông báo
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastTransaction = new Date(lastTransactionDate);
  lastTransaction.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((today.getTime() - lastTransaction.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 3) return; // Chưa đến 3 ngày, không gửi

  // Lần đầu nhắc nhở sau 3 ngày (3-6 ngày)
  if (diffDays >= 3 && diffDays < 7) {
    const key = `inactivity-${userId}-3days`;
    if (!hasSentNotification(userId, 'REMINDER', key)) {
      await sendNotification(
        userId,
        'REMINDER',
        t('messages.inactivity.title'),
        t('messages.inactivity.message3Days', { days: diffDays })
      );
      markNotificationAsSent(userId, 'REMINDER', key);
    }
  }
  // Lần nhắc nhở thứ 2 sau 7 ngày (7-13 ngày)
  else if (diffDays >= 7 && diffDays < 14) {
    const key = `inactivity-${userId}-7days`;
    if (!hasSentNotification(userId, 'REMINDER', key)) {
      await sendNotification(
        userId,
        'REMINDER',
        t('messages.inactivity.title'),
        t('messages.inactivity.message7Days', { days: diffDays })
      );
      markNotificationAsSent(userId, 'REMINDER', key);
    }
  }
  // Sau 14 ngày trở lên, không gửi thêm (người dùng có thể đã ngừng sử dụng app)
};

// Kiểm tra chi tiêu vượt ngưỡng (Thông báo WARNING) - DEPRECATED: Dùng BudgetContext thay thế
export const checkExpensesWarning = async (
  userId: string | number,
  totalExpenses: number,
  budget: number
) => {
  // kiểm tra settings
  if (!isNotificationEnabled('budgetAlerts')) {
    return;
  }

  if (totalExpenses > budget * 0.8) {
    const key = `expenses-warning-${userId}`;
    if (!hasSentNotification(userId, 'WARNING', key)) {
      await sendNotification(
        userId,
        'WARNING',
        'Chi tiêu tháng này vượt ngưỡng',
        `Bạn đã chi ${formatCurrency(totalExpenses)} trong tháng này, vượt 80% ngân sách (${formatCurrency(budget)}). Hãy cẩn thận với chi tiêu của mình!`
      );
      markNotificationAsSent(userId, 'WARNING', key);
    }
  }
};

// Kiểm tra số dư ví thấp (Thông báo WARNING)
export const checkLowBalance = async (
  userId: string | number,
  wallet: { name: string; balance: number }
) => {
  // Kiểm tra settings
  if (!isNotificationEnabled('lowBalanceAlerts')) {
    return;
  }

  const LOW_BALANCE_THRESHOLD = 200000; // 200.000 VND
  if (wallet.balance < LOW_BALANCE_THRESHOLD && wallet.balance >= 0) {
    const key = `low-balance-${userId}-${wallet.name}`;
    if (!hasSentNotification(userId, 'WARNING', key)) {
      await sendNotification(
        userId,
        'WARNING',
        t('messages.lowBalance.title', { walletName: wallet.name }),
        t('messages.lowBalance.message', {
          walletName: wallet.name,
          balance: formatCurrency(wallet.balance),
          threshold: formatCurrency(LOW_BALANCE_THRESHOLD)
        })
      );
      markNotificationAsSent(userId, 'WARNING', key);
    }
  }
};

// Kiểm tra giao dịch chi tiêu lớn (Thông báo WARNING) - chỉ cho EXPENSE
export const checkLargeTransaction = async (
  userId: string | number,
  transaction: { description: string; amount: number; type?: 'INCOME' | 'EXPENSE' }
) => {
  // Kiểm tra settings
  if (!isNotificationEnabled('largeTransactionAlerts')) {
    return;
  }

  const LARGE_TRANSACTION_THRESHOLD = 10000000; // 10 triệu VND
  // Chỉ cảnh báo cho giao dịch CHI TIÊU lớn, không cảnh báo cho thu nhập
  if (
    transaction.amount > LARGE_TRANSACTION_THRESHOLD &&
    transaction.type !== 'INCOME'
  ) {
    const transactionLabel =
      transaction.description?.trim() && transaction.description.trim().length > 0
        ? transaction.description.trim()
        : t('messages.largeTransaction.noDescription');

    await sendNotification(
      userId,
      'WARNING',
      t('messages.largeTransaction.title'),
      t('messages.largeTransaction.message', {
        amount: formatCurrency(transaction.amount),
        description: transactionLabel
      })
    );
  }
};

// Kiểm tra tiến độ mục tiêu (Thông báo SUCCESS)
export const checkGoalProgress = async (
  userId: string | number,
  goal: { id: string | number; name: string; current_amount: number; target_amount: number }
) => {
  // Kiểm tra settings
  if (!isNotificationEnabled('goalProgressAlerts')) {
    return;
  }

  if (goal.target_amount <= 0) return;
  const progress = (goal.current_amount / goal.target_amount) * 100;

  // Kiểm tra đạt 50% mục tiêu
  if (progress >= 50 && progress < 100) {
    const key = `goal-progress-50-${userId}-${goal.id}`;
    if (!hasSentNotification(userId, 'SUCCESS', key)) {
      await sendNotification(
        userId,
        'SUCCESS',
        t('messages.goalProgress.title'),
        t('messages.goalProgress.message', {
          progress: Math.round(progress),
          goalName: goal.name,
          currentAmount: formatCurrency(goal.current_amount),
          targetAmount: formatCurrency(goal.target_amount)
        })
      );
      markNotificationAsSent(userId, 'SUCCESS', key);
    }
  }
};

// Kiểm tra hoàn thành mục tiêu (Thông báo SUCCESS)
export const checkGoalCompletion = async (
  userId: string | number,
  goal: { id: string | number; name: string; current_amount: number; target_amount: number }
) => {
  // Kiểm tra settings
  if (!isNotificationEnabled('goalCompletionAlerts')) {
    return;
  }

  if (goal.target_amount <= 0) return;
  if (goal.current_amount >= goal.target_amount) {
    const key = `goal-completion-${userId}-${goal.id}`;
    if (!hasSentNotification(userId, 'SUCCESS', key)) {
      await sendNotification(
        userId,
        'SUCCESS',
        t('messages.goalCompletion.title'),
        t('messages.goalCompletion.message', {
          goalName: goal.name,
          amount: formatCurrency(goal.current_amount)
        })
      );
      markNotificationAsSent(userId, 'SUCCESS', key);
    }
  }
};

// Thông tin tổng kết giao dịch tháng (Thông báo INFO) - Gửi vào đầu tháng sau
export const sendMonthlySummary = async (
  userId: string | number,
  month: string, // Format: "YYYY-MM"
  totalSpent: number,
  totalIncome: number,
  mainCategory?: string
) => {
  // Kiểm tra settings
  if (!isNotificationEnabled('monthlySummaryAlerts')) {
    return;
  }

  const key = `monthly-summary-${userId}-${month}`;
  if (!hasSentNotification(userId, 'INFO', key)) {
    let message: string;
    if (mainCategory && totalIncome > 0) {
      message = t('messages.monthlySummary.messageWithCategory', {
        month,
        totalSpent: formatCurrency(totalSpent),
        totalIncome: formatCurrency(totalIncome),
        mainCategory
      });
    } else if (mainCategory && totalIncome === 0) {
      message = t('messages.monthlySummary.messageWithCategoryNoIncome', {
        month,
        totalSpent: formatCurrency(totalSpent),
        mainCategory
      });
    } else if (totalIncome > 0) {
      message = t('messages.monthlySummary.messageWithIncome', {
        month,
        totalSpent: formatCurrency(totalSpent),
        totalIncome: formatCurrency(totalIncome)
      });
    } else {
      message = t('messages.monthlySummary.message', {
        month,
        totalSpent: formatCurrency(totalSpent)
      });
    }
    await sendNotification(userId, 'INFO', t('messages.monthlySummary.title'), message);
    markNotificationAsSent(userId, 'INFO', key);
  }
};

// Nhắc nhở giao dịch định kỳ sắp đến hạn (Thông báo REMINDER)
export const sendRecurringTransactionReminder = async (
  userId: string | number,
  recurringTransaction: {
    id: string | number;
    description: string;
    nextDate: string;
    amount: number;
  }
) => {
  // Kiểm tra settings
  if (!isNotificationEnabled('recurringTransactionReminders')) {
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextDate = new Date(recurringTransaction.nextDate);
  nextDate.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // Nhắc nhở 1 ngày trước khi đến hạn
  if (diffDays === 1) {
    const key = `recurring-reminder-${userId}-${recurringTransaction.id}-${nextDate.toISOString().split('T')[0]}`;
    if (!hasSentNotification(userId, 'REMINDER', key)) {
      await sendNotification(
        userId,
        'REMINDER',
        t('messages.recurringTransaction.title'),
        t('messages.recurringTransaction.message', {
          description: recurringTransaction.description,
          amount: formatCurrency(recurringTransaction.amount)
        })
      );
      markNotificationAsSent(userId, 'REMINDER', key);
    }
  }
};

// Nhắc nhở mục tiêu gần đến deadline (Thông báo REMINDER)
export const sendGoalDeadlineReminder = async (
  userId: string | number,
  goal: {
    id: string | number;
    name: string;
    deadline: string;
    current_amount: number;
    target_amount: number;
  }
) => {
  // Kiểm tra settings
  if (!isNotificationEnabled('goalDeadlineReminders')) {
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(goal.deadline);
  deadline.setHours(0, 0, 0, 0);
  const daysRemaining = Math.floor((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const progress = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;

  // Nhắc nhở khi còn 7 ngày và tiến độ < 80%
  if (daysRemaining <= 7 && daysRemaining > 0 && progress < 80) {
    const key = `goal-deadline-${userId}-${goal.id}-${daysRemaining}`;
    if (!hasSentNotification(userId, 'REMINDER', key)) {
      await sendNotification(
        userId,
        'REMINDER',
        t('messages.goalDeadline.title'),
        t('messages.goalDeadline.message', {
          goalName: goal.name,
          daysRemaining,
          progress: Math.round(progress),
          currentAmount: formatCurrency(goal.current_amount),
          targetAmount: formatCurrency(goal.target_amount)
        })
      );
      markNotificationAsSent(userId, 'REMINDER', key);
    }
  }
};

// Kiểm tra nếu thông báo đã được gửi
const hasSentNotification = (
  userId: string | number,
  type: string,
  key: string
): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const notificationKey = `notification-${userId}-${type}-${key}`;
    return localStorage.getItem(notificationKey) !== null;
  } catch {
    return false;
  }
};

// Đánh dấu thông báo đã gửi
const markNotificationAsSent = (
  userId: string | number,
  type: string,
  key: string
) => {
  if (typeof window === 'undefined') return;
  try {
    const notificationKey = `notification-${userId}-${type}-${key}`;
    localStorage.setItem(notificationKey, new Date().toISOString());
  } catch (error) {
    console.error('Error marking notification as sent:', error);
  }
};

// Xóa đánh dấu thông báo đã gửi (dùng khi cần reset)
export const clearNotificationSent = (
  userId: string | number,
  type: string,
  key: string
) => {
  if (typeof window === 'undefined') return;
  try {
    const notificationKey = `notification-${userId}-${type}-${key}`;
    localStorage.removeItem(notificationKey);
  } catch (error) {
    console.error('Error clearing notification sent:', error);
  }
};


