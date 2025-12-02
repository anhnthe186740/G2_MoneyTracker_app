import { useState, useContext, useEffect } from 'react';
import { X } from 'lucide-react';
import { TransactionContext } from '../context/TransactionContext';
import type { Category, Wallet, Transaction } from '../types';
import { checkExpensesWarning, checkLowBalance, checkLargeTransaction } from '../services/notificationService';  // Import các hàm kiểm tra

interface TransactionFormProps {
    userId: number;
    wallets: Wallet[];
    categories: Category[];
    onClose: () => void;
    onSuccess: () => void;
    editTransaction?: Transaction | null;
}

export default function TransactionForm({
    userId,
    wallets,
    categories,
    onClose,
    onSuccess,
    editTransaction
}: TransactionFormProps) {
    const transactionContext = useContext(TransactionContext);
    if (!transactionContext) {
        throw new Error('TransactionForm must be used within TransactionProvider');
    }

    const { createTransaction, updateTransaction } = transactionContext;
    const [formData, setFormData] = useState({
        walletId: '',
        categoryId: '',
        amount: '',
        type: 'EXPENSE' as 'INCOME' | 'EXPENSE',
        description: '',
        date: new Date().toISOString().split('T')[0],
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (editTransaction) {
            setFormData({
                walletId: String(editTransaction.walletId),
                categoryId: String(editTransaction.categoryId),
                amount: String(editTransaction.amount),
                type: editTransaction.type,
                description: editTransaction.description,
                date: new Date(editTransaction.date).toISOString().split('T')[0],
            });
        }
    }, [editTransaction]);

    const filteredCategories = categories.filter(c => c.type === formData.type);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!formData.walletId || !formData.categoryId || !formData.amount) {
            setError('Vui lòng điền đầy đủ thông tin');
            return;
        }

        try {
            setLoading(true);

            if (editTransaction) {
                // Cập nhật giao dịch
                await updateTransaction(editTransaction.id, {
                    walletId: Number(formData.walletId),
                    categoryId: Number(formData.categoryId),
                    amount: Number(formData.amount),
                    type: formData.type,
                    description: formData.description,
                    date: new Date(formData.date).toISOString(),
                });
            } else {
                // Tạo giao dịch mới
                await createTransaction({
                    userId,
                    walletId: Number(formData.walletId),
                    categoryId: Number(formData.categoryId),
                    amount: Number(formData.amount),
                    type: formData.type,
                    description: formData.description,
                    date: new Date(formData.date).toISOString(),
                });
            }

            // Kiểm tra và gửi thông báo tự động
            checkExpensesWarning(userId.toString(), Number(formData.amount), 5000000);
            checkLowBalance(userId.toString(), { name: 'tiền mặt', balance: Number(formData.amount) });
            checkLargeTransaction(userId.toString(), { description: formData.description, amount: Number(formData.amount) });


            onSuccess();
            onClose();
        } catch (err) {
            setError(editTransaction ? 'Có lỗi xảy ra khi cập nhật giao dịch' : 'Có lỗi xảy ra khi tạo giao dịch');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">{editTransaction ? 'Sửa giao dịch' : 'Thêm giao dịch'}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <X size={24} />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Type */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Loại giao dịch</label>
                        <div className="flex gap-4">
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    value="EXPENSE"
                                    checked={formData.type === 'EXPENSE'}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        type: e.target.value as 'EXPENSE',
                                        categoryId: ''
                                    })}
                                    className="mr-2"
                                />
                                Chi tiêu
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    value="INCOME"
                                    checked={formData.type === 'INCOME'}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        type: e.target.value as 'INCOME',
                                        categoryId: ''
                                    })}
                                    className="mr-2"
                                />
                                Thu nhập
                            </label>
                        </div>
                    </div>

                    {/* Wallet */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Ví</label>
                        <select
                            value={formData.walletId}
                            onChange={(e) => setFormData({ ...formData, walletId: e.target.value })}
                            className="w-full border rounded px-3 py-2"
                            required
                        >
                            <option value="">Chọn ví</option>
                            {wallets.map((wallet) => (
                                <option key={wallet.id} value={wallet.id}>
                                    {wallet.name} - {wallet.balance.toLocaleString('vi-VN')} ₫
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Danh mục</label>
                        <select
                            value={formData.categoryId}
                            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                            className="w-full border rounded px-3 py-2"
                            required
                        >
                            <option value="">Chọn danh mục</option>
                            {filteredCategories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Amount */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Số tiền</label>
                        <input
                            type="number"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            className="w-full border rounded px-3 py-2"
                            placeholder="0"
                            min="0"
                            required
                        />
                    </div>

                    {/* Date */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Ngày</label>
                        <input
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="w-full border rounded px-3 py-2"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Mô tả</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full border rounded px-3 py-2"
                            rows={3}
                            placeholder="Nhập mô tả..."
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
                            disabled={loading}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                            disabled={loading}
                        >
                            {loading ? 'Đang lưu...' : 'Lưu'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
