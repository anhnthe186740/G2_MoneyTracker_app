import { useEffect, useContext } from 'react';
import { Trash2, ToggleLeft, ToggleRight, Edit } from 'lucide-react';
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

const frequencyLabels = {
    DAILY: 'Hàng ngày',
    WEEKLY: 'Hàng tuần',
    MONTHLY: 'Hàng tháng',
    YEARLY: 'Hàng năm',
};

export default function RecurringTransactionList({
    userId,
    wallets,
    categories,
    onUpdate,
    onEdit
}: RecurringTransactionListProps) {
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
            alert('Có lỗi xảy ra khi cập nhật trạng thái');
        }
    };

    const handleDelete = async (id: number | string) => {
        if (confirm('Bạn có chắc muốn xóa giao dịch định kỳ này?')) {
            try {
                await deleteRecurringTransactionContext(id);
                onUpdate();
            } catch (error) {
                console.error('Error deleting recurring transaction:', error);
                alert('Có lỗi xảy ra khi xóa giao dịch định kỳ');
            }
        }
    };

    const getWalletName = (walletId: number | string) => {
        return wallets.find(w => String(w.id) === String(walletId))?.name || 'Unknown';
    };

    const getCategoryName = (categoryId: number | string) => {
        // Handle NaN case
        if (Number.isNaN(categoryId) || categoryId === 'NaN' || !categoryId) {
            console.warn('[RecurringTransactionList] Invalid categoryId:', categoryId);
            return '[Danh m\u1ee5c b\u1ecb x\u00f3a]';
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
        
        return category?.name || `[Danh mục #${categoryId} đã xóa]`;
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
                <h2 className="text-2xl font-bold">Thu/Chi định kỳ</h2>
            </div>

            {recurringTransactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    Không có giao dịch định kỳ nào
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left py-3 px-4">Danh mục</th>
                                <th className="text-left py-3 px-4">Ví</th>
                                <th className="text-left py-3 px-4">Mô tả</th>
                                <th className="text-left py-3 px-4">Tần suất</th>
                                <th className="text-left py-3 px-4">Ngày tiếp theo</th>
                                <th className="text-right py-3 px-4">Số tiền</th>
                                <th className="text-center py-3 px-4">Trạng thái</th>
                                <th className="text-center py-3 px-4">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recurringTransactions.map((rt) => (
                                <tr
                                    key={rt.id}
                                    className={`border-b hover:bg-gray-50 ${!rt.isActive ? 'opacity-50' : ''}`}
                                >
                                    <td className="py-3 px-4">
                                        <span
                                            className="inline-block px-3 py-1 rounded-full text-white text-sm"
                                            style={{ backgroundColor: getCategoryColor(rt.categoryId) }}
                                        >
                                            {getCategoryName(rt.categoryId).includes('xóa') && '⚠️ '}
                                            {getCategoryName(rt.categoryId)}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">{getWalletName(rt.walletId)}</td>
                                    <td className="py-3 px-4">{rt.description}</td>
                                    <td className="py-3 px-4">{frequencyLabels[rt.frequency]}</td>
                                    <td className="py-3 px-4">
                                        {format(new Date(rt.nextDate), 'dd/MM/yyyy')}
                                    </td>
                                    <td className={`py-3 px-4 text-right font-semibold ${rt.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        {rt.type === 'INCOME' ? '+' : '-'}
                                        {rt.amount.toLocaleString('vi-VN')} ₫
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <button
                                            onClick={() => handleToggleActive(rt.id, rt.isActive)}
                                            className={`${rt.isActive ? 'text-green-600' : 'text-gray-400'
                                                } hover:opacity-70`}
                                            title={rt.isActive ? 'Tắt' : 'Bật'}
                                        >
                                            {rt.isActive ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                                        </button>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <div className="flex justify-center gap-2">
                                            <button
                                                onClick={() => onEdit(rt)}
                                                className="text-blue-600 hover:text-blue-800"
                                                title="Sửa"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(rt.id)}
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
