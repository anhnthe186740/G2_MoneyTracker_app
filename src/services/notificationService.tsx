import api from './api'; 

// Hàm gửi thông báo
export const sendNotification = async (userId: string, type: string, title: string, message: string) => {
  try {
    await api.post('/notifications', {
      user_id: userId,
      type: type,
      title: title,
      message: message,
      is_read: false, 
      created_at: new Date().toISOString(), 
    });
    console.log(`Thông báo đã được gửi cho user ${userId}`);
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

// Kiểm tra giao dịch chưa ghi chép 
export const checkInactivity = async (userId: string, lastTransactionDate: string) => {
  const currentDate = new Date();
  const lastTransaction = new Date(lastTransactionDate);
  const diffDays = Math.floor((currentDate.getTime() - lastTransaction.getTime()) / (1000 * 3600 * 24)); // Tính số ngày chênh lệch

  // Lần đầu nhắc nhở sau 3 ngày không có giao dịch
  if (diffDays >= 3 && diffDays < 7) {
    if (!hasSentNotification(userId, 'REMINDER', 'Nhắc bạn ghi chép chi tiêu')) {
      sendNotification(userId, 'REMINDER', 'Nhắc bạn ghi chép chi tiêu', `Bạn đã ${diffDays} ngày không ghi lại bất kỳ giao dịch nào. Hãy cập nhật ngay để theo dõi chi tiêu.`);
      markNotificationAsSent(userId, 'REMINDER', 'Nhắc bạn ghi chép chi tiêu');
    }
  }

  // Lần nhắc nhở thứ 2 nếu sau 1 tuần không có giao dịch
  if (diffDays >= 7 && diffDays < 14) {
    if (!hasSentNotification(userId, 'REMINDER', 'Nhắc bạn ghi chép chi tiêu')) {
      sendNotification(userId, 'REMINDER', 'Nhắc bạn ghi chép chi tiêu', `Bạn đã ${diffDays} ngày không ghi lại bất kỳ giao dịch nào. Cập nhật ngay để tiếp tục theo dõi chi tiêu.`);
      markNotificationAsSent(userId, 'REMINDER', 'Nhắc bạn ghi chép chi tiêu');
    }
  }

  // Dừng không gửi thêm nếu người dùng không ghi giao dịch sau 1 tuần
  if (diffDays >= 14) {
    console.log(`Ngừng gửi thông báo nhắc nhở giao dịch cho user ${userId} vì đã quá lâu.`);
  }
};

// Kiểm tra chi tiêu vượt ngưỡng (Thông báo WARNING)
export const checkExpensesWarning = async (userId: string, totalExpenses: number, budget: number) => {
  if (totalExpenses > budget * 0.8) {  // Kiểm tra chi tiêu vượt 80% ngân sách
    if (!hasSentNotification(userId, 'WARNING', 'Chi tiêu tháng này vượt ngưỡng')) {
      sendNotification(userId, 'WARNING', 'Chi tiêu tháng này vượt ngưỡng', `Bạn đã chi ${totalExpenses}₫ trong tháng này. Cẩn thận với chi tiêu của mình!`);
      markNotificationAsSent(userId, 'WARNING', 'Chi tiêu tháng này vượt ngưỡng');
    }
  }
};

// Kiểm tra số dư ví thấp (Thông báo WARNING)
export const checkLowBalance = async (userId: string, wallet: { name: string, balance: number }) => {
  if (wallet.balance < 200000) {  // Nếu số dư dưới 200.000đ
    if (!hasSentNotification(userId, 'WARNING', `Ví ${wallet.name} sắp cạn`)) {
      sendNotification(userId, 'WARNING', `Ví ${wallet.name} sắp cạn`, `Số dư ví ${wallet.name} của bạn còn dưới 200.000₫. Hãy bổ sung thêm tiền!`);
      markNotificationAsSent(userId, 'WARNING', `Ví ${wallet.name} sắp cạn`);
    }
  }
};

// Kiểm tra giao dịch chi tiêu lớn (Thông báo WARNING)
export const checkLargeTransaction = async (userId: string, transaction: { description: string, amount: number }) => {
  if (transaction.amount > 10000000) {  
    if (!hasSentNotification(userId, 'WARNING', 'Giao dịch chi tiêu lớn')) {
      sendNotification(userId, 'WARNING', 'Giao dịch chi tiêu lớn', `Bạn đã chi ${transaction.amount}₫ cho "${transaction.description}". Kiểm tra lại chi tiêu của mình!`);
      markNotificationAsSent(userId, 'WARNING', 'Giao dịch chi tiêu lớn');
    }
  }
};

// Kiểm tra tiến độ mục tiêu (Thông báo SUCCESS)
export const checkGoalProgress = async (userId: string, goal: { name: string, current_amount: number, target_amount: number }) => {
  if (goal.current_amount / goal.target_amount >= 0.5) {  // Kiểm tra đạt 50% mục tiêu
    if (!hasSentNotification(userId, 'SUCCESS', 'Tiến độ mục tiêu')) {
      sendNotification(userId, 'SUCCESS', 'Tiến độ mục tiêu', `Chúc mừng! Bạn đã đạt 50% mục tiêu '${goal.name}'. Tiếp tục cố gắng!`);
      markNotificationAsSent(userId, 'SUCCESS', 'Tiến độ mục tiêu');
    }
  }
};

// Kiểm tra hoàn thành mục tiêu (Thông báo SUCCESS)
export const checkGoalCompletion = async (userId: string, goal: { name: string, current_amount: number, target_amount: number }) => {
  if (goal.current_amount >= goal.target_amount) {  // Nếu mục tiêu hoàn thành
    if (!hasSentNotification(userId, 'SUCCESS', 'Mục tiêu đã hoàn thành')) {
      sendNotification(userId, 'SUCCESS', 'Mục tiêu đã hoàn thành', `Xin chúc mừng! Bạn đã đạt được mục tiêu '${goal.name}'.`);
      markNotificationAsSent(userId, 'SUCCESS', 'Mục tiêu đã hoàn thành');
    }
  }
};

// Thông tin tổng kết giao dịch tháng (Thông báo INFO)
export const sendMonthlySummary = async (userId: string, totalSpent: number, mainCategory: string) => {
  if (!hasSentNotification(userId, 'INFO', 'Tóm tắt giao dịch tháng')) {
    sendNotification(userId, 'INFO', 'Tóm tắt giao dịch tháng', `Bạn đã chi tổng cộng ${totalSpent}₫ trong tháng này. Danh mục '${mainCategory}' chiếm phần lớn tổng chi.`);
    markNotificationAsSent(userId, 'INFO', 'Tóm tắt giao dịch tháng');
  }
};

// Thông tin về số dư ví (Thông báo INFO)
export const sendBalanceUpdate = async (userId: string, wallet: { name: string, balance: number }) => {
  if (!hasSentNotification(userId, 'INFO', `Cập nhật số dư ví ${wallet.name}`)) {
    sendNotification(userId, 'INFO', `Cập nhật số dư ví ${wallet.name}`, `Số dư ví ${wallet.name} của bạn là ${wallet.balance}₫.`);
    markNotificationAsSent(userId, 'INFO', `Cập nhật số dư ví ${wallet.name}`);
  }
};

// Kiểm tra giao dịch chưa ghi chép (Thông báo REMINDER)
export const sendInactivityReminder = async (userId: string, daysInactive: number) => {
  if (!hasSentNotification(userId, 'REMINDER', 'Nhắc bạn ghi chép chi tiêu')) {
    sendNotification(userId, 'REMINDER', 'Nhắc bạn ghi chép chi tiêu', `Bạn đã ${daysInactive} ngày không ghi lại bất kỳ giao dịch nào. Hãy cập nhật ngay để theo dõi chi tiêu.`);
    markNotificationAsSent(userId, 'REMINDER', 'Nhắc bạn ghi chép chi tiêu');
  }
};

// Nhắc nhở giao dịch định kỳ (Thông báo REMINDER)
export const sendRecurringTransactionReminder = async (userId: string, transactionDate: string) => {
  if (!hasSentNotification(userId, 'REMINDER', 'Giao dịch định kỳ')) {
    sendNotification(userId, 'REMINDER', 'Giao dịch định kỳ', `Hóa đơn điện thoại sẽ đến hạn vào ngày ${transactionDate}. Bạn nhớ thanh toán nhé!`);
    markNotificationAsSent(userId, 'REMINDER', 'Giao dịch định kỳ');
  }
};

// Nhắc nhở mục tiêu gần đến deadline (Thông báo REMINDER)
export const sendGoalDeadlineReminder = async (userId: string, goalName: string, daysRemaining: number, progress: number) => {
  if (!hasSentNotification(userId, 'REMINDER', 'Mục tiêu gần đến deadline')) {
    sendNotification(userId, 'REMINDER', 'Mục tiêu gần đến deadline', `Mục tiêu '${goalName}' sẽ hết hạn trong ${daysRemaining} ngày. Bạn chỉ mới đạt ${progress}% tiến độ.`);
    markNotificationAsSent(userId, 'REMINDER', 'Mục tiêu gần đến deadline');
  }
};

// Kiểm tra nếu thông báo đã được gửi
const hasSentNotification = (userId: string, type: string, title: string): boolean => {
    const notificationKey = `${userId}-${type}-${title}`;
    return localStorage.getItem(notificationKey) !== null;  // Kiểm tra nếu thông báo đã được lưu trong localStorage
};

// Đánh dấu thông báo đã gửi
const markNotificationAsSent = (userId: string, type: string, title: string) => {
    const notificationKey = `${userId}-${type}-${title}`;
    localStorage.setItem(notificationKey, 'sent');
};
