import { useEffect, useContext, useMemo } from 'react';
import { Trash2, ToggleLeft, ToggleRight, Edit } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { RecurringTransactionContext } from '../context/RecurringTransactionContext';
import type { Category, Wallet, RecurringTransaction } from '../types';
import { format } from 'date-fns';

interface RecurringTransactionListProps {
    userId: number;
    wallets: Wallet[];
    categories: Category[];
    onUpdate: () => void;
    onEdit: (transaction: RecurringTransaction) => void;
}

export default function RecurringTransactionList({
    userId,
    wallets,
    categories,
    onUpdate,
    onEdit
}: RecurringTransactionListProps) {
    const { t } = useTranslation('recurring');
    const recurringTransactionContext = useContext(RecurringTransactionContext);
    if (!recurringTransactionContext) {
        throw new Error('RecurringTransactionList must be used within RecurringTransactionProvider');
    }

    const {
        recurringTransactions,
        loading,
        getRecurringTransactions,
        updateRecurringTransaction,
        deleteRecurringTransaction: deleteRecurringTransactionContext
    } = recurringTransactionContext;

    const frequencyLabels = useMemo(() => ({
        DAILY: t('frequency.daily'),
        WEEKLY: t('frequency.weekly'),
        MONTHLY: t('frequency.monthly'),
        YEARLY: t('frequency.yearly'),
    }), [t]);

    useEffect(() => {
        console.log('[RecurringTransactionList] Loading recurring transactions for user:', userId);
        getRecurringTransactions(userId);
    }, [userId, getRecurringTransactions]);

    const handleToggleActive = async (id: number | string, currentStatus: boolean) => {
        try {
            await updateRecurringTransaction(id, { isActive: !currentStatus });
            onUpdate();
        } catch (error) {
            console.error('Error toggling recurring transaction:', error);
            alert(t('toast.error'));
        }
    };

    const handleDelete = async (id: number | string) => {
        if (confirm(t('table.confirmDelete'))) {
            try {
                await deleteRecurringTransactionContext(id);
                onUpdate();
            } catch (error) {
                console.error('Error deleting recurring transaction:', error);
                alert(t('table.deleteError'));
            }
        }
    };

    const getWalletName = (walletId: number | string) => {
        return wallets.find(w => String(w.id) === String(walletId))?.name || t('table.unknown');
    };

    const getCategoryName = (categoryId: number | string) => {
        // Handle NaN case
        if (Number.isNaN(categoryId) || categoryId === 'NaN' || !categoryId) {
            console.warn('[RecurringTransactionList] Invalid categoryId:', categoryId);
            return t('table.categoryDeleted');
        }

        const category = categories.find(c => {
            // Try multiple comparison methods to handle type mismatches
            return c.id === categoryId ||
                String(c.id) === String(categoryId) ||
                Number(c.id) === Number(categoryId);
        });

        if (!category) {
            console.error('[RecurringTransactionList] Category NOT FOUND:',
                'ID:', categoryId,
                'Type:', typeof categoryId,
                'Available:', categories.map(c => `${c.id}(${typeof c.id})`).join(', ')
            );
        }

        return category?.name || t('table.categoryDeletedWithId', { id: categoryId });
    };

    const getCategoryColor = (categoryId: number | string) => {
        // Handle NaN or invalid IDs
        if (Number.isNaN(categoryId) || categoryId === 'NaN' || !categoryId) {
            return '#6B7280'; // gray-500
        }

        const category = categories.find(c => {
            return c.id === categoryId ||
                String(c.id) === String(categoryId) ||
                Number(c.id) === Number(categoryId);
        });
        return category?.color || '#6B7280'; // gray-500 for deleted categories
    };

    if (loading) {
        return <div className="text-center py-8 text-muted-foreground">{t('loading')}</div>;
    }

    return (
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-6 border border-border dark:border-slate-800">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-foreground">{t('table.title')}</h2>
            </div>

            {recurringTransactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    {t('empty.noTransactions')}
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border dark:border-slate-800">
                                <th className="text-left py-3 px-4">{t('table.headers.category')}</th>
                                <th className="text-left py-3 px-4">{t('table.headers.wallet')}</th>
                                <th className="text-left py-3 px-4">{t('table.headers.description')}</th>
                                <th className="text-left py-3 px-4">{t('table.headers.frequency')}</th>
                                <th className="text-left py-3 px-4">{t('table.headers.nextDate')}</th>
                                <th className="text-right py-3 px-4">{t('table.headers.amount')}</th>
                                <th className="text-center py-3 px-4">{t('table.headers.status')}</th>
                                <th className="text-center py-3 px-4">{t('table.headers.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border dark:divide-slate-800">
                            {recurringTransactions.map((rt) => (
                                <tr
                                    key={rt.id}
                                    className={`hover:bg-gray-50 dark:hover:bg-slate-800 ${!rt.isActive ? 'opacity-60' : ''}`}
                                >
                                    <td className="py-3 px-4">
                                        <span
                                            className="inline-block px-3 py-1 rounded-full text-white text-sm"
                                            style={{ backgroundColor: getCategoryColor(rt.categoryId) }}
                                        >
                                            {(getCategoryName(rt.categoryId).includes('xóa') || getCategoryName(rt.categoryId).includes('Deleted')) && '⚠️ '}
                                            {getCategoryName(rt.categoryId)}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-foreground">{getWalletName(rt.walletId)}</td>
                                    <td className="py-3 px-4 text-muted-foreground">{rt.description}</td>
                                    <td className="py-3 px-4 text-foreground">{frequencyLabels[rt.frequency]}</td>
                                    <td className="py-3 px-4">
                                        {format(new Date(rt.nextDate), 'dd/MM/yyyy')}
                                    </td>
                                    <td className={`py-3 px-4 text-right font-semibold ${rt.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        {rt.type === 'INCOME' ? '+' : '-'}
                                        {rt.amount.toLocaleString()} {t('currency')}
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <button
                                            onClick={() => handleToggleActive(rt.id, rt.isActive)}
                                            className={`${rt.isActive ? 'text-green-600 dark:text-green-300' : 'text-gray-400 dark:text-gray-500'
                                                } hover:opacity-70`}
                                            title={rt.isActive ? t('toggle.on') : t('toggle.off')}
                                        >
                                            {rt.isActive ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                                        </button>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <div className="flex justify-center gap-2">
                                            <button
                                                onClick={() => onEdit(rt)}
                                                className="text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200"
                                                title={t('actions.edit')}
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(rt.id)}
                                                className="text-red-600 hover:text-red-800 dark:text-red-300 dark:hover:text-red-200"
                                                title={t('actions.delete')}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
