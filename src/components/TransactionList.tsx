import { useState, useEffect, useContext } from 'react';
import { Trash2, Filter, ArrowUpDown, Edit } from 'lucide-react';
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

        // Apply sort
        filtered.sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        });

        setFilteredTransactions(filtered);
    }, [transactions, filterType, sortOrder]);

    const handleDelete = async (id: number | string) => {
        if (confirm('Bạn có chắc muốn xóa giao dịch này?')) {
            try {
                await deleteTransaction(id);
                onUpdate();
            } catch (error) {
                console.error('Error deleting transaction:', error);
                alert('Có lỗi xảy ra khi xóa giao dịch');
            }
        }
    };

    const getWalletName = (walletId: number | string) => {
        return wallets.find(w => String(w.id) === String(walletId))?.name || 'Unknown';
    };

    const getCategoryName = (categoryId: number | string) => {
        // Handle NaN case
        if (Number.isNaN(categoryId) || categoryId === 'NaN' || !categoryId) {
            console.warn('[getCategoryName] Invalid categoryId:', categoryId);
            return '[Danh m\u1ee5c b\u1ecb x\u00f3a]';
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
        
        return category?.name || `[Danh m\u1ee5c #${categoryId} \u0111\u00e3 x\u00f3a]`;
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
        return <div className="text-center py-8">Đang tải...</div>;
    }

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Danh sách giao dịch</h2>

                <div className="flex gap-4">
                    {/* Filter */}
                    <div className="flex items-center gap-2">
                        <Filter size={20} />
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value as 'ALL' | 'INCOME' | 'EXPENSE')}
                            className="border rounded px-3 py-2"
                        >
                            <option value="ALL">Tất cả</option>
                            <option value="INCOME">Thu nhập</option>
                            <option value="EXPENSE">Chi tiêu</option>
                        </select>
                    </div>

                    {/* Sort */}
                    <button
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        className="flex items-center gap-2 border rounded px-3 py-2 hover:bg-gray-50"
                    >
                        <ArrowUpDown size={20} />
                        {sortOrder === 'asc' ? 'Cũ nhất' : 'Mới nhất'}
                    </button>
                </div>
            </div>

            {filteredTransactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Không có giao dịch nào</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left py-3 px-4">Ngày</th>
                                <th className="text-left py-3 px-4">Danh mục</th>
                                <th className="text-left py-3 px-4">Ví</th>
                                <th className="text-left py-3 px-4">Mô tả</th>
                                <th className="text-right py-3 px-4">Số tiền</th>
                                <th className="text-center py-3 px-4">Thao tác</th>
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
                                        {transaction.amount.toLocaleString('vi-VN')} ₫
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <div className="flex justify-center gap-2">
                                            <button
                                                onClick={() => onEdit(transaction)}
                                                className="text-blue-600 hover:text-blue-800"
                                                title="Sửa"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(transaction.id)}
                                                className="text-red-600 hover:text-red-800"
                                                title="Xóa"
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
