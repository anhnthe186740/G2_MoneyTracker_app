import { useState, useEffect, useContext } from 'react';
import { Trash2, Filter, ArrowUpDown, Edit } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TransactionContext } from '../context/TransactionContext';
import type { Category, Wallet, Transaction } from '../types';
import { format } from 'date-fns';

interface TransactionListProps {
    userId: number;
    wallets: Wallet[];
    categories: Category[];
    onUpdate: () => void;
    onEdit: (transaction: Transaction) => void;
}

export default function TransactionList({ userId, wallets, categories, onUpdate, onEdit }: TransactionListProps) {
    const { t } = useTranslation('transactions');
    const transactionContext = useContext(TransactionContext);
    if (!transactionContext) {
        throw new Error('TransactionList must be used within TransactionProvider');
    }

    const { transactions, loading, getTransactions, deleteTransaction } = transactionContext;
    const [filteredTransactions, setFilteredTransactions] = useState<typeof transactions>([]);
    const [filterType, setFilterType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    useEffect(() => {
        console.log('[TransactionList] Loading transactions for user:', userId);
        getTransactions(userId);
    }, [userId, getTransactions]);

    useEffect(() => {
        let filtered = [...transactions];

        // Apply filter
        if (filterType !== 'ALL') {
            filtered = filtered.filter(t => t.type === filterType);
        }

        // Apply sort - Sort by creation time (newest first by default)
        filtered.sort((a, b) => {
            const timeA = new Date(a.createdAt).getTime();
            const timeB = new Date(b.createdAt).getTime();
            return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
        });

        setFilteredTransactions(filtered);
    }, [transactions, filterType, sortOrder]);

    const handleDelete = async (id: number | string) => {
        if (confirm(t('table.confirmDelete'))) {
            try {
                await deleteTransaction(id);
                onUpdate();
            } catch (error) {
                console.error('Error deleting transaction:', error);
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
            console.warn('[getCategoryName] Invalid categoryId:', categoryId);
            return t('table.categoryDeleted');
        }

        const category = categories.find(c => {
            // Try multiple comparison methods to handle type mismatches
            const match = c.id === categoryId ||
                String(c.id) === String(categoryId) ||
                Number(c.id) === Number(categoryId);
            return match;
        });

        if (!category) {
            console.error('[getCategoryName] Category NOT FOUND:', {
                searchedId: categoryId,
                searchedIdType: typeof categoryId,
                categoriesCount: categories.length,
                availableCategories: categories.map(c => ({
                    id: c.id,
                    idType: typeof c.id,
                    name: c.name,
                    match1: c.id === categoryId,
                    match2: String(c.id) === String(categoryId),
                    match3: Number(c.id) === Number(categoryId)
                }))
            });
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
        return <div className="text-center py-8">{t('loading')}</div>;
    }

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">{t('table.title')}</h2>

                <div className="flex gap-4">
                    {/* Filter */}
                    <div className="flex items-center gap-2">
                        <Filter size={20} />
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value as 'ALL' | 'INCOME' | 'EXPENSE')}
                            className="border rounded px-3 py-2"
                        >
                            <option value="ALL">{t('table.filters.all')}</option>
                            <option value="INCOME">{t('table.filters.income')}</option>
                            <option value="EXPENSE">{t('table.filters.expense')}</option>
                        </select>
                    </div>

                    {/* Sort Order */}
                    <button
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        className="flex items-center gap-2 border rounded px-3 py-2 hover:bg-gray-50"
                    >
                        <ArrowUpDown size={20} />
                        {sortOrder === 'asc' ? t('table.sort.oldest') : t('table.sort.newest')}
                    </button>
                </div>
            </div>

            {filteredTransactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">{t('table.empty')}</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left py-3 px-4">{t('table.headers.date')}</th>
                                <th className="text-left py-3 px-4">{t('table.headers.category')}</th>
                                <th className="text-left py-3 px-4">{t('table.headers.wallet')}</th>
                                <th className="text-left py-3 px-4">{t('table.headers.description')}</th>
                                <th className="text-right py-3 px-4">{t('table.headers.amount')}</th>
                                <th className="text-center py-3 px-4">{t('table.headers.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTransactions.map((transaction) => (
                                <tr key={transaction.id} className="border-b hover:bg-gray-50">
                                    <td className="py-3 px-4">
                                        {format(new Date(transaction.date), 'dd/MM/yyyy')}
                                    </td>
                                    <td className="py-3 px-4">
                                        <span
                                            className="inline-block px-3 py-1 rounded-full text-white text-sm"
                                            style={{ backgroundColor: getCategoryColor(transaction.categoryId) }}
                                        >
                                            {getCategoryName(transaction.categoryId)}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">{getWalletName(transaction.walletId)}</td>
                                    <td className="py-3 px-4">{transaction.description}</td>
                                    <td className={`py-3 px-4 text-right font-semibold ${transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        {transaction.type === 'INCOME' ? '+' : '-'}
                                        {transaction.amount.toLocaleString()} {t('currency')}
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <div className="flex justify-center gap-2">
                                            <button
                                                onClick={() => onEdit(transaction)}
                                                className="text-blue-600 hover:text-blue-800"
                                                title={t('actions.edit')}
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(transaction.id)}
                                                className="text-red-600 hover:text-red-800"
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
