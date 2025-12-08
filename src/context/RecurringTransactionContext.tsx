import { createContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import api from '../services/api';
import type { RecurringTransaction } from '../types';
import { sendRecurringTransactionReminder } from '../services/notificationService';

interface RecurringTransactionContextType {
    recurringTransactions: RecurringTransaction[];
    loading: boolean;
    error: string | null;
    getRecurringTransactions: (userId: number | string) => Promise<void>;
    getRecurringTransactionById: (id: number | string) => Promise<RecurringTransaction | null>;
    createRecurringTransaction: (recurringTransaction: Omit<RecurringTransaction, 'id' | 'createdAt'>) => Promise<void>;
    updateRecurringTransaction: (id: number | string, recurringTransaction: Partial<RecurringTransaction>) => Promise<void>;
    deleteRecurringTransaction: (id: number | string) => Promise<void>;
    processRecurringTransactions: (userId: number | string) => Promise<void>;
}

// Helper function to calculate next date (defined outside component)
const calculateNextDate = (currentDate: Date, frequency: RecurringTransaction['frequency']): Date => {
    const nextDate = new Date(currentDate);

    switch (frequency) {
        case 'DAILY':
            nextDate.setDate(nextDate.getDate() + 1);
            break;
        case 'WEEKLY':
            nextDate.setDate(nextDate.getDate() + 7);
            break;
        case 'MONTHLY':
            nextDate.setMonth(nextDate.getMonth() + 1);
            break;
        case 'YEARLY':
            nextDate.setFullYear(nextDate.getFullYear() + 1);
            break;
    }

    return nextDate;
};

// Helper function to update wallet balance (defined outside component)
const updateWalletBalance = async (walletId: number | string, amount: number, type: 'INCOME' | 'EXPENSE', userId?: number | string) => {
    console.log(`Updating wallet balance: walletId=${walletId}, amount=${amount}, type=${type}, userId=${userId}`);

    try {
        // If userId is provided, use it to filter wallets to avoid ID collision
        let wallet;
        if (userId) {
            const walletsResponse = await api.get<any[]>(`/wallets?id=${walletId}&user_id=${userId}`);
            if (walletsResponse.data && walletsResponse.data.length > 0) {
                wallet = walletsResponse.data[0];
                console.log(`Found wallet via query: id=${wallet.id}, user_id=${wallet.user_id}, balance=${wallet.balance}`);
            } else {
                throw new Error(`Wallet not found: id=${walletId}, user_id=${userId}`);
            }
        } else {
            const walletResponse = await api.get<any>(`/wallets/${walletId}`);
            wallet = walletResponse.data;
            console.log(`Found wallet via direct GET: id=${wallet.id}, balance=${wallet.balance}`);
        }

        const currentBalance = Number(wallet.balance);
        const amountNum = Number(amount);

        const newBalance = type === 'INCOME'
            ? currentBalance + amountNum
            : currentBalance - amountNum;

        console.log(`Balance update: ${currentBalance} ${type === 'INCOME' ? '+' : '-'} ${amountNum} = ${newBalance}`);
        await api.patch(`/wallets/${walletId}`, { balance: newBalance });
        console.log('Wallet balance updated successfully');
    } catch (error) {
        console.error('Error updating wallet balance:', error);
        throw error;
    }
};

export const RecurringTransactionContext = createContext<RecurringTransactionContextType | undefined>(undefined);

export const RecurringTransactionProvider = ({ children }: { children: ReactNode }) => {
    const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false); // Flag to prevent concurrent processing

    const getRecurringTransactions = useCallback(async (userId: number | string) => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get<any[]>(`/recurring_transactions?user_id=${userId}`);

            // Map snake_case to camelCase - keep IDs as original type
            const mapped = response.data.map((rt: any) => ({
                id: rt.id, // Keep original ID (string or number)
                userId: rt.user_id,
                walletId: rt.wallet_id, // Keep as string or number
                categoryId: rt.category_id, // Keep as string or number
                amount: rt.amount,
                type: rt.type,
                description: rt.description,
                frequency: rt.frequency,
                startDate: rt.start_date,
                endDate: rt.end_date,
                nextDate: rt.next_date,
                isActive: rt.is_active,
                createdAt: rt.created_at
            }));

            setRecurringTransactions(mapped);

            // NOTE: Notifications are sent during processRecurringTransactions, not here
            // to avoid duplicate notifications every time we reload the list
        } catch (err) {
            console.error('Error loading recurring transactions:', err);
            setError('Không thể tải danh sách giao dịch định kỳ');
        } finally {
            setLoading(false);
        }
    }, []);

    const getRecurringTransactionById = useCallback(async (id: number | string): Promise<RecurringTransaction | null> => {
        try {
            const response = await api.get<any>(`/recurring_transactions/${id}`);
            const rt = response.data;

            // Map snake_case to camelCase
            return {
                id: rt.id, // Keep original ID
                userId: rt.user_id,
                walletId: rt.wallet_id,
                categoryId: rt.category_id,
                amount: rt.amount,
                type: rt.type,
                description: rt.description,
                frequency: rt.frequency,
                startDate: rt.start_date,
                endDate: rt.end_date,
                nextDate: rt.next_date,
                isActive: rt.is_active,
                createdAt: rt.created_at
            };
        } catch (err) {
            console.error('Error loading recurring transaction:', err);
            setError('Không thể tải thông tin giao dịch định kỳ');
            return null;
        }
    }, []);

    const createRecurringTransaction = useCallback(async (
        recurringTransaction: Omit<RecurringTransaction, 'id' | 'createdAt'>
    ) => {
        try {
            setLoading(true);
            setError(null);

            // Map camelCase to snake_case for db.json
            const newRecurringTransaction = {
                user_id: recurringTransaction.userId,
                wallet_id: recurringTransaction.walletId,
                category_id: recurringTransaction.categoryId,
                amount: recurringTransaction.amount,
                type: recurringTransaction.type,
                description: recurringTransaction.description,
                frequency: recurringTransaction.frequency,
                start_date: recurringTransaction.startDate,
                end_date: recurringTransaction.endDate,
                next_date: recurringTransaction.nextDate,
                is_active: recurringTransaction.isActive,
                created_at: new Date().toISOString(),
            };

            await api.post('/recurring_transactions', newRecurringTransaction);

            // Reload recurring transactions
            await getRecurringTransactions(recurringTransaction.userId);
            
            // If nextDate is today or past and isActive, process immediately
            const nextDate = new Date(recurringTransaction.nextDate);
            nextDate.setHours(0, 0, 0, 0);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (recurringTransaction.isActive && nextDate <= today) {
                console.log('=== New recurring transaction needs immediate processing ===');
                // Wait a bit for database to be ready
                await new Promise(resolve => setTimeout(resolve, 200));
                // Process without lock check (this is a fresh creation)
                setLoading(true);
                const response = await api.get<any[]>(`/recurring_transactions?user_id=${recurringTransaction.userId}`);
                const newRt = response.data[response.data.length - 1]; // Get the last created one
                
                if (newRt && newRt.is_active) {
                    console.log('Creating immediate transaction for new recurring:', newRt.id);
                    
                    // Create transaction
                    const newTransaction = {
                        user_id: newRt.user_id,
                        wallet_id: newRt.wallet_id,
                        category_id: newRt.category_id,
                        amount: newRt.amount,
                        type: newRt.type,
                        description: newRt.description,
                        date: nextDate.toISOString(),
                        created_at: new Date().toISOString(),
                        recurring_transaction_id: newRt.id,
                    };
                    
                    await api.post('/transactions', newTransaction);
                    console.log('Immediate transaction created');
                    
                    // Update wallet balance
                    await updateWalletBalance(newRt.wallet_id, newRt.amount, newRt.type, newRt.user_id);
                    
                    // Update next_date
                    const frequency = newRt.frequency;
                    const newNextDate = calculateNextDate(nextDate, frequency);
                    await api.patch(`/recurring_transactions/${newRt.id}`, {
                        next_date: newNextDate.toISOString()
                    });
                    
                    // Send notification
                    try {
                        await sendRecurringTransactionReminder(newRt.user_id, {
                            id: newRt.id,
                            description: newRt.description,
                            nextDate: newNextDate.toISOString(),
                            amount: newRt.amount,
                        });
                    } catch (notifyErr) {
                        console.error('Error sending notification:', notifyErr);
                    }
                }
            }
        } catch (err) {
            console.error('Error creating recurring transaction:', err);
            setError('Không thể tạo giao dịch định kỳ');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [getRecurringTransactions]);

    const updateRecurringTransaction = useCallback(async (
        id: number | string,
        recurringTransaction: Partial<RecurringTransaction>
    ) => {
        try {
            setLoading(true);
            setError(null);

            const oldTransaction = await getRecurringTransactionById(id);
            if (!oldTransaction) throw new Error('Recurring transaction not found');

            // Map camelCase to snake_case for db.json
            const updateData: any = {};
            if (recurringTransaction.userId !== undefined) updateData.user_id = recurringTransaction.userId;
            if (recurringTransaction.walletId !== undefined) updateData.wallet_id = recurringTransaction.walletId;
            if (recurringTransaction.categoryId !== undefined) updateData.category_id = recurringTransaction.categoryId;
            if (recurringTransaction.amount !== undefined) updateData.amount = recurringTransaction.amount;
            if (recurringTransaction.type !== undefined) updateData.type = recurringTransaction.type;
            if (recurringTransaction.description !== undefined) updateData.description = recurringTransaction.description;
            if (recurringTransaction.frequency !== undefined) updateData.frequency = recurringTransaction.frequency;
            if (recurringTransaction.startDate !== undefined) updateData.start_date = recurringTransaction.startDate;
            if (recurringTransaction.endDate !== undefined) updateData.end_date = recurringTransaction.endDate;
            if (recurringTransaction.nextDate !== undefined) updateData.next_date = recurringTransaction.nextDate;
            if (recurringTransaction.isActive !== undefined) updateData.is_active = recurringTransaction.isActive;

            await api.patch(`/recurring_transactions/${id}`, updateData);

            // Reload recurring transactions
            await getRecurringTransactions(oldTransaction.userId);
        } catch (err) {
            console.error('Error updating recurring transaction:', err);
            setError('Không thể cập nhật giao dịch định kỳ');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [getRecurringTransactionById, getRecurringTransactions]);

    const deleteRecurringTransaction = useCallback(async (id: number | string) => {
        try {
            setLoading(true);
            setError(null);

            const transaction = await getRecurringTransactionById(id);
            if (!transaction) throw new Error('Recurring transaction not found');

            await api.delete(`/recurring_transactions/${id}`);

            // Reload recurring transactions
            await getRecurringTransactions(transaction.userId);
        } catch (err) {
            console.error('Error deleting recurring transaction:', err);
            setError('Không thể xóa giao dịch định kỳ');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [getRecurringTransactionById, getRecurringTransactions]);

    const processRecurringTransactions = useCallback(async (userId: number | string) => {
        // Prevent concurrent processing using both state and localStorage
        const lockKey = `processing_recurring_${userId}`;
        const isLocked = localStorage.getItem(lockKey);

        if (processing || isLocked) {
            console.log('Already processing recurring transactions, skipping...', { processing, isLocked });
            return;
        }

        try {
            setProcessing(true);
            localStorage.setItem(lockKey, Date.now().toString());
            setLoading(true);
            setError(null);

            const response = await api.get<any[]>(`/recurring_transactions?user_id=${userId}`);
            const recurringTransactionsList = response.data.map((rt: any) => ({
                id: rt.id, // Keep original ID (string or number)
                userId: rt.user_id,
                walletId: rt.wallet_id,
                categoryId: rt.category_id,
                amount: rt.amount,
                type: rt.type,
                description: rt.description,
                frequency: rt.frequency,
                startDate: rt.start_date,
                endDate: rt.end_date,
                nextDate: rt.next_date,
                isActive: rt.is_active,
                createdAt: rt.created_at
            }));
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            for (const rt of recurringTransactionsList) {
                if (!rt.isActive) continue;

                const nextDate = new Date(rt.nextDate);
                nextDate.setHours(0, 0, 0, 0);

                // Check if it's time to create a transaction
                if (nextDate <= today) {
                    console.log(`Processing recurring transaction: ${rt.id}, nextDate: ${nextDate.toDateString()}, today: ${today.toDateString()}`);

                    // Check if end date has passed
                    if (rt.endDate && new Date(rt.endDate) < today) {
                        console.log(`End date passed for recurring transaction ${rt.id}, deactivating...`);
                        await api.patch(`/recurring_transactions/${rt.id}`, { is_active: false });
                        continue;
                    }

                    // Check if transaction already exists for this recurring transaction on nextDate
                    // Use recurring_transaction_id to accurately track
                    const existingTransactionsResponse = await api.get(
                        `/transactions?user_id=${userId}&recurring_transaction_id=${rt.id}`
                    );
                    const nextDateStr = nextDate.toISOString().split('T')[0];
                    const now = new Date();
                    const fiveSecondsAgo = new Date(now.getTime() - 5000);

                    // Check if already processed for this exact date
                    // Also check for very recent duplicates (within 5 seconds)
                    const alreadyProcessedForDate = existingTransactionsResponse.data.some((t: any) => {
                        const tDate = new Date(t.date);
                        tDate.setHours(0, 0, 0, 0);
                        const tDateStr = tDate.toISOString().split('T')[0];

                        if (tDateStr === nextDateStr) {
                            // If same date, also check if created very recently
                            const tCreatedAt = new Date(t.created_at);
                            if (tCreatedAt >= fiveSecondsAgo) {
                                console.log(`Recent duplicate detected for ${nextDateStr}, transaction ${t.id} created at ${t.created_at}`);
                                return true;
                            }
                            return true;
                        }
                        return false;
                    });

                    if (alreadyProcessedForDate) {
                        console.log(`Transaction already exists for date ${nextDateStr} for recurring ${rt.id}, updating next_date...`);
                        // Update next_date to move forward
                        const newNextDate = calculateNextDate(nextDate, rt.frequency);
                        console.log(`Updating next_date from ${nextDate.toDateString()} to ${newNextDate.toDateString()}`);
                        await api.patch(`/recurring_transactions/${rt.id}`, {
                            next_date: newNextDate.toISOString()
                        });
                        continue;
                    }

                    // Create the transaction (map to snake_case)
                    // Use nextDate as the transaction date to match the scheduled date
                    const newTransaction = {
                        user_id: rt.userId,
                        wallet_id: rt.walletId,
                        category_id: rt.categoryId,
                        amount: rt.amount,
                        type: rt.type,
                        description: rt.description,
                        date: nextDate.toISOString(), // Use nextDate instead of today
                        created_at: new Date().toISOString(),
                        recurring_transaction_id: rt.id, // Track which recurring created this
                    };

                    // Calculate next date FIRST (as a lock mechanism)
                    const newNextDate = calculateNextDate(nextDate, rt.frequency);
                    console.log(`Updating next_date from ${nextDate.toDateString()} to ${newNextDate.toDateString()}`);

                    // Update next_date immediately to prevent race condition
                    await api.patch(`/recurring_transactions/${rt.id}`, {
                        next_date: newNextDate.toISOString()
                    });

                    // Wait a tiny bit to ensure database is updated
                    await new Promise(resolve => setTimeout(resolve, 100));

                    // Double check one more time before creating
                    const doubleCheckResponse = await api.get(
                        `/transactions?user_id=${userId}&recurring_transaction_id=${rt.id}`
                    );
                    const stillNoDuplicate = !doubleCheckResponse.data.some((t: any) => {
                        const tDate = new Date(t.date);
                        tDate.setHours(0, 0, 0, 0);
                        const tDateStr = tDate.toISOString().split('T')[0];
                        return tDateStr === nextDateStr;
                    });

                    if (!stillNoDuplicate) {
                        console.log(`Duplicate detected during double-check for ${nextDateStr}, skipping creation`);
                        continue;
                    }

                    console.log('Creating transaction:', newTransaction);
                    await api.post('/transactions', newTransaction);
                    console.log('Transaction created successfully');

                    // Update wallet balance
                    console.log('Updating wallet balance...');
                    await updateWalletBalance(rt.walletId, rt.amount, rt.type, rt.userId);

                    // Send notification for the created transaction
                    try {
                        await sendRecurringTransactionReminder(rt.userId, {
                            id: rt.id,
                            description: rt.description,
                            nextDate: newNextDate.toISOString(), // Next occurrence
                            amount: rt.amount,
                        });
                        console.log('Notification sent for recurring transaction:', rt.id);
                    } catch (notifyErr) {
                        console.error(`Error sending notification for recurring transaction ${rt.id}:`, notifyErr);
                    }

                    console.log(`Recurring transaction ${rt.id} processed successfully`);
                }
            }

            // Reload recurring transactions
            await getRecurringTransactions(userId);
        } catch (err) {
            console.error('Error processing recurring transactions:', err);
            setError('Không thể xử lý giao dịch định kỳ');
            throw err;
        } finally {
            setLoading(false);
            setProcessing(false);
            // Clear lock after a short delay to ensure completion
            const lockKey = `processing_recurring_${userId}`;
            setTimeout(() => {
                localStorage.removeItem(lockKey);
            }, 1000);
        }
    }, [processing, getRecurringTransactions]);

    return (
        <RecurringTransactionContext.Provider
            value={{
                recurringTransactions,
                loading,
                error,
                getRecurringTransactions,
                getRecurringTransactionById,
                createRecurringTransaction,
                updateRecurringTransaction,
                deleteRecurringTransaction,
                processRecurringTransactions,
            }}
        >
            {children}
        </RecurringTransactionContext.Provider>
    );
};