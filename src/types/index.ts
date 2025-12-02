export interface User {
  id: number;
  username: string;
  email: string;
  password?: string;       // optional vì sẽ xóa khi lưu
  fullName: string;
  currency: string;
  createdAt: string;
}
export interface Wallet {
  id: number | string;
  userId: number | string;
  name: string;
  type: "BANK" | "E_WALLET" | "CASH";
  balance: number;
  color: string;
  createdAt: string;
}

export interface Category {
  id: number | string;
  userId: number | string;
  name: string;
  type: "INCOME" | "EXPENSE";
  color: string;
  icon: string;
}

export interface Transaction {
  id: number | string;
  userId: number | string;
  walletId: number | string;
  categoryId: number | string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  description: string;
  date: string;
  createdAt: string;
  recurringTransactionId?: number | string; // ID của recurring transaction tạo ra transaction này
}

export interface Goal {
  id: number;
  userId: number;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
}

export interface Notification {
  id: string;
  user_id: number;
  type: "WARNING" | "SUCCESS" | "INFO" | "REMINDER";
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}


export interface RecurringTransaction {
  id: number | string;
  userId: number | string;
  walletId: number | string;
  categoryId: number | string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  description: string;
  frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  startDate: string;
  endDate?: string;
  nextDate: string;
  isActive: boolean;
  createdAt: string;
}
