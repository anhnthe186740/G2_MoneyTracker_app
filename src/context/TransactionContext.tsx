import { createContext, useState, useCallback, type ReactNode } from 'react';
import api from '../services/api';
import type { Transaction } from '../types';
import { checkExpensesWarning, checkLowBalance, checkLargeTransaction } from '../services/notificationService';  // Import các hàm kiểm tra

interface TransactionContextType {
    transactions: Transaction[];
    loading: boolean;
    error: string | null;
    getTransactions: (userId: number) => Promise<void>;
    getTransactionById: (id: number | string) => Promise<Transaction | null>;
    createTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
    updateTransaction: (id: number | string, transaction: Partial<Transaction>) => Promise<void>;
    deleteTransaction: (id: number | string) => Promise<void>;
}

export const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const TransactionProvider = ({ children }: { children: ReactNode }) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getTransactions = useCallback(async (userId: number) => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get<any[]>(`/transactions?user_id=${userId}`);

            // Map snake_case to camelCase
            const mappedTransactions = response.data.map((t: any) => ({
                id: t.id, // Keep original ID (can be string or number)
                userId: t.user_id,
                walletId: t.wallet_id,
                categoryId: t.category_id,
                amount: t.amount,
                type: t.type,
                description: t.description,
                date: t.date,
                createdAt: t.created_at
            }));

            setTransactions(mappedTransactions);
        } catch (err) {
            console.error('Error loading transactions:', err);
            setError('Không thể tải danh sách giao dịch');
        } finally {
            setLoading(false);
        }
    }, []);

    const getTransactionById = useCallback(async (id: number | string): Promise<Transaction | null> => {
        try {
            if (id === null || id === undefined) {
                return null;
            }
            const response = await api.get<any>(`/transactions/${id}`);
            const t = response.data;

            // Map snake_case to camelCase
            return {
                id: t.id, // Keep original ID
                userId: t.user_id,
                walletId: t.wallet_id,
                categoryId: t.category_id,
                amount: t.amount,
                type: t.type,
                description: t.description,
                date: t.date,
                createdAt: t.created_at
            };
        } catch (err) {
            console.error('Error loading transaction:', err);
            setError('Không thể tải thông tin giao dịch');
            return null;
        }
    }, []);

    const createTransaction = useCallback(async (transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
        try {
            setLoading(true);
            setError(null);

            // Map camelCase to snake_case for db.json
            const newTransaction = {
                user_id: transaction.userId,
                wallet_id: transaction.walletId,
                category_id: transaction.categoryId,
                amount: transaction.amount,
                type: transaction.type,
                description: transaction.description,
                date: transaction.date,
                created_at: new Date().toISOString(),
            };

            await api.post('/transactions', newTransaction);

            // Update wallet balance
            await updateWalletBalance(transaction.walletId, transaction.amount, transaction.type);

            // Kiểm tra và gửi thông báo tự động
            checkExpensesWarning(transaction.userId?.toString() ?? "", transaction.amount ?? 0, 10000000);  
            checkLowBalance(transaction.userId?.toString() ?? "", { name: 'Tiền mặt', balance: transaction.amount ?? 0 });
            checkLargeTransaction(transaction.userId?.toString() ?? "", { description: transaction.description ?? "", amount: transaction.amount ?? 0 });

            // Reload transactions
            await getTransactions(transaction.userId);
        } catch (err) {
            console.error('Error creating transaction:', err);
            setError('Không thể tạo giao dịch');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [getTransactions]);

    const updateTransaction = useCallback(async (id: number | string, transaction: Partial<Transaction>) => {
        try {
            setLoading(true);
            setError(null);

            // Get old transaction to revert balance
            const oldTransaction = await getTransactionById(id);
            if (!oldTransaction) throw new Error('Transaction not found');

            // Revert old balance
            await updateWalletBalance(
                oldTransaction.walletId,
                oldTransaction.amount,
                oldTransaction.type === 'INCOME' ? 'EXPENSE' : 'INCOME'
            );

            // Map camelCase to snake_case for db.json
            const updateData: any = {};
            if (transaction.userId !== undefined) updateData.user_id = transaction.userId;
            if (transaction.walletId !== undefined) updateData.wallet_id = transaction.walletId;
            if (transaction.categoryId !== undefined) updateData.category_id = transaction.categoryId;
            if (transaction.amount !== undefined) updateData.amount = transaction.amount;
            if (transaction.type !== undefined) updateData.type = transaction.type;
            if (transaction.description !== undefined) updateData.description = transaction.description;
            if (transaction.date !== undefined) updateData.date = transaction.date;

            await api.patch(`/transactions/${id}`, updateData);

            // Apply new balance
            if (transaction.walletId && transaction.amount && transaction.type) {
                await updateWalletBalance(transaction.walletId, transaction.amount, transaction.type);
            }

            // Kiểm tra và gửi thông báo tự động
            checkExpensesWarning(transaction.userId?.toString() ?? "", transaction.amount ?? 0, 10000000);  
            checkLowBalance(transaction.userId?.toString() ?? "", { name: 'tiền mặt', balance: transaction.amount ?? 0 });
            checkLargeTransaction(transaction.userId?.toString() ?? "", { description: transaction.description ?? "", amount: transaction.amount ?? 0 });

            // Reload transactions
            await getTransactions(oldTransaction.userId);
        } catch (err) {
            console.error('Error updating transaction:', err);
            setError('Không thể cập nhật giao dịch');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [getTransactionById, getTransactions]);

    const deleteTransaction = useCallback(async (id: number | string) => {
        try {
            setLoading(true);
            setError(null);

            // Get transaction to revert balance
            const transaction = await getTransactionById(id);
            if (!transaction) throw new Error('Transaction not found');

            // Revert balance
            await updateWalletBalance(
                transaction.walletId,
                transaction.amount,
                transaction.type === 'INCOME' ? 'EXPENSE' : 'INCOME'
            );

            await api.delete(`/transactions/${id}`);

            // Reload transactions
            await getTransactions(transaction.userId);
        } catch (err) {
            console.error('Error deleting transaction:', err);
            setError('Không thể xóa giao dịch');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [getTransactionById, getTransactions]);

    // Helper function to update wallet balance
    const updateWalletBalance = async (walletId: number, amount: number, type: 'INCOME' | 'EXPENSE') => {
        const walletResponse = await api.get<any>(`/wallets/${walletId}`);
        const wallet = walletResponse.data;

        const newBalance = type === 'INCOME'
            ? wallet.balance + amount
            : wallet.balance - amount;

        await api.patch(`/wallets/${walletId}`, { balance: newBalance });
    };

    return (
        <TransactionContext.Provider
            value={{
                transactions,
                loading,
                error,
                getTransactions,
                getTransactionById,
                createTransaction,
                updateTransaction,
                deleteTransaction,
            }}
        >
            {children}
        </TransactionContext.Provider>
    );
};
