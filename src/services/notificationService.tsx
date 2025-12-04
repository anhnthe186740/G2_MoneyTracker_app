import api from './api';

// Format số tiền VND
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
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
        'Nhắc bạn ghi chép chi tiêu',
        `Bạn đã ${diffDays} ngày không ghi lại bất kỳ giao dịch nào. Hãy cập nhật ngay để theo dõi chi tiêu hiệu quả hơn!`
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
        'Nhắc bạn ghi chép chi tiêu',
        `Bạn đã ${diffDays} ngày không ghi lại bất kỳ giao dịch nào. Cập nhật ngay để tiếp tục theo dõi chi tiêu của mình!`
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
  const LOW_BALANCE_THRESHOLD = 200000; // 200.000 VND
  if (wallet.balance < LOW_BALANCE_THRESHOLD && wallet.balance >= 0) {
    const key = `low-balance-${userId}-${wallet.name}`;
    if (!hasSentNotification(userId, 'WARNING', key)) {
      await sendNotification(
        userId,
        'WARNING',
        `Ví ${wallet.name} sắp cạn`,
        `Số dư ví ${wallet.name} của bạn còn ${formatCurrency(wallet.balance)}, dưới ${formatCurrency(LOW_BALANCE_THRESHOLD)}. Hãy bổ sung thêm tiền để tránh thiếu hụt!`
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
  const LARGE_TRANSACTION_THRESHOLD = 10000000; // 10 triệu VND
  // Chỉ cảnh báo cho giao dịch CHI TIÊU lớn, không cảnh báo cho thu nhập
  if (
    transaction.amount > LARGE_TRANSACTION_THRESHOLD &&
    transaction.type !== 'INCOME'
  ) {
    const transactionLabel =
      transaction.description?.trim() && transaction.description.trim().length > 0
        ? transaction.description.trim()
        : 'giao dịch không có mô tả';

    await sendNotification(
      userId,
      'WARNING',
      'Giao dịch chi tiêu lớn',
      `Bạn vừa thực hiện một giao dịch chi tiêu lớn: ${formatCurrency(transaction.amount)} cho "${transactionLabel}". Hãy kiểm tra lại chi tiêu của mình!`
    );
  }
};

// Kiểm tra tiến độ mục tiêu (Thông báo SUCCESS)
export const checkGoalProgress = async (
  userId: string | number,
  goal: { id: string | number; name: string; current_amount: number; target_amount: number }
) => {
  if (goal.target_amount <= 0) return;
  const progress = (goal.current_amount / goal.target_amount) * 100;

  // Kiểm tra đạt 50% mục tiêu
  if (progress >= 50 && progress < 100) {
    const key = `goal-progress-50-${userId}-${goal.id}`;
    if (!hasSentNotification(userId, 'SUCCESS', key)) {
      await sendNotification(
        userId,
        'SUCCESS',
        'Tiến độ mục tiêu',
        `Chúc mừng! Bạn đã đạt ${Math.round(progress)}% mục tiêu "${goal.name}" (${formatCurrency(goal.current_amount)} / ${formatCurrency(goal.target_amount)}). Tiếp tục cố gắng nhé!`
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
  if (goal.target_amount <= 0) return;
  if (goal.current_amount >= goal.target_amount) {
    const key = `goal-completion-${userId}-${goal.id}`;
    if (!hasSentNotification(userId, 'SUCCESS', key)) {
      await sendNotification(
        userId,
        'SUCCESS',
        'Mục tiêu đã hoàn thành',
        `🎉 Xin chúc mừng! Bạn đã đạt được mục tiêu "${goal.name}" với số tiền ${formatCurrency(goal.current_amount)}. Thật tuyệt vời!`
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
  const key = `monthly-summary-${userId}-${month}`;
  if (!hasSentNotification(userId, 'INFO', key)) {
    let message = `Tổng kết tháng ${month}: Bạn đã chi ${formatCurrency(totalSpent)}`;
    if (totalIncome > 0) {
      message += ` và thu ${formatCurrency(totalIncome)}`;
    }
    if (mainCategory) {
      message += `. Danh mục "${mainCategory}" chiếm phần lớn tổng chi tiêu.`;
    } else {
      message += '.';
    }
    await sendNotification(userId, 'INFO', 'Tóm tắt giao dịch tháng', message);
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
        'Nhắc nhở giao dịch định kỳ',
        `Giao dịch định kỳ "${recurringTransaction.description}" (${formatCurrency(recurringTransaction.amount)}) sẽ được thực hiện vào ngày mai. Hãy kiểm tra số dư ví của bạn!`
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
        'Mục tiêu gần đến deadline',
        `Mục tiêu "${goal.name}" sẽ hết hạn trong ${daysRemaining} ngày. Bạn chỉ mới đạt ${Math.round(progress)}% tiến độ (${formatCurrency(goal.current_amount)} / ${formatCurrency(goal.target_amount)}). Hãy cố gắng thêm nhé!`
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


