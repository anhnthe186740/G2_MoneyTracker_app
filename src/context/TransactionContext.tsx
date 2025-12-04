import { createContext, useState, useCallback, type ReactNode } from 'react';
import api from '../services/api';
import type { Transaction } from '../types';

interface TransactionContextType {
    transactions: Transaction[];
    loading: boolean;
    error: string | null;
    getTransactions: (userId: number) => Promise<void>;
    getTransactionById: (id: number | string) => Promise<Transaction | undefined>;
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
                userId: Number(t.user_id),
                walletId: t.wallet_id, // Keep as string or number
                categoryId: t.category_id, // Keep as string or number
                amount: Number(t.amount),
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

    const getTransactionById = useCallback(async (id: number | string): Promise<Transaction | undefined> => {
        try {
            if (id === null || id === undefined) {
                return undefined;
            }
            const response = await api.get<any>(`/transactions/${id}`);
            const t = response.data;

            // Map snake_case to camelCase
            return {
                id: t.id, // Keep original ID
                userId: Number(t.user_id),
                walletId: t.wallet_id, // Keep as string or number
                categoryId: t.category_id, // Keep as string or number
                amount: Number(t.amount),
                type: t.type,
                description: t.description,
                date: t.date,
                createdAt: t.created_at
            };
        } catch (err) {
            console.error('Error loading transaction:', err);
            setError('Không thể tải thông tin giao dịch');
            return undefined;
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

            // Create transaction first
            const response = await api.post('/transactions', newTransaction);
            console.log('Transaction created:', response.data);

            // Update wallet balance (catch error but don't throw)
            try {
                console.log('About to update wallet balance...');
                await updateWalletBalance(transaction.walletId, transaction.amount, transaction.type);
                console.log('Wallet balance updated');
            } catch (balanceErr) {
                console.error('Could not update wallet balance:', balanceErr);
            }

            // Reload transactions (catch error but don't throw)
            try {
                await getTransactions(transaction.userId as any);
            } catch (reloadErr) {
                console.warn('Could not reload transactions:', reloadErr);
            }
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

            // Revert old balance (catch error but continue)
            try {
                await updateWalletBalance(
                    oldTransaction.walletId,
                    oldTransaction.amount,
                    oldTransaction.type === 'INCOME' ? 'EXPENSE' : 'INCOME'
                );
            } catch (balanceErr) {
                console.warn('Could not revert wallet balance:', balanceErr);
            }

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

            // Apply new balance (catch error but continue)
            if (transaction.walletId && transaction.amount && transaction.type) {
                try {
                    await updateWalletBalance(transaction.walletId, transaction.amount, transaction.type);
                } catch (balanceErr) {
                    console.warn('Could not update wallet balance:', balanceErr);
                }
            }

            // Reload transactions (catch error but don't throw)
            try {
                await getTransactions(oldTransaction.userId as any);
            } catch (reloadErr) {
                console.warn('Could not reload transactions:', reloadErr);
            }
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

            // Try to find the transaction locally first to avoid an extra network call
            let transaction = transactions.find(t => String(t.id) === String(id));

            // Fallback to fetching the transaction if it's not present locally
            if (!transaction) {
                transaction = await getTransactionById(id);
            }

            if (!transaction) throw new Error('Transaction not found');

            // Delete transaction on server
            await api.delete(`/transactions/${id}`);

            // Optimistically update local transactions state
            setTransactions(prev => prev.filter(t => String(t.id) !== String(id)));

            // Revert balance (catch error but continue)
            try {
                await updateWalletBalance(
                    transaction.walletId,
                    transaction.amount,
                    transaction.type === 'INCOME' ? 'EXPENSE' : 'INCOME'
                );
            } catch (balanceErr) {
                console.warn('Could not revert wallet balance:', balanceErr);
            }

            // Ensure server sync: reload transactions - don't fail user action if this errors
            try {
                await getTransactions(transaction.userId as any);
            } catch (reloadErr) {
                console.warn('Could not reload transactions:', reloadErr);
            }
        } catch (err) {
            console.error('Error deleting transaction:', err);
            setError('Không thể xóa giao dịch');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [getTransactionById, getTransactions, transactions]);

    // Helper function to update wallet balance
    const updateWalletBalance = async (walletId: number | string, amount: number, type: 'INCOME' | 'EXPENSE') => {
        try {
            console.log('Updating wallet balance:', { walletId, amount, type });

            const walletResponse = await api.get<any>(`/wallets/${walletId}`);
            const wallet = walletResponse.data;

            console.log('Current wallet:', wallet);

            const newBalance = type === 'INCOME'
                ? Number(wallet.balance) + Number(amount)
                : Number(wallet.balance) - Number(amount);

            console.log('New balance:', newBalance);

            await api.patch(`/wallets/${walletId}`, { balance: newBalance });

            console.log('Wallet balance updated successfully');
        } catch (err) {
            console.error('Error updating wallet balance:', err);
            throw err;
        }
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
