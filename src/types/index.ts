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
  id: number;
  userId: number;
  name: string;
  type: "BANK" | "E_WALLET" | "CASH";
  balance: number;
  color: string;
  createdAt: string;
}

export interface Category {
  id: number;
  userId: number;
  name: string;
  type: "INCOME" | "EXPENSE";
  color: string;
  icon: string;
}

export interface Transaction {
  id: number;
  userId: number;
  walletId: number;
  categoryId: number;
  amount: number;
  type: "INCOME" | "EXPENSE";
  description: string;
  date: string;
  createdAt: string;
}

export interface Goal {
  id: number;
  userId: number;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
}