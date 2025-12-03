import { useState, useContext, useEffect } from 'react';
import { X } from 'lucide-react';
import { RecurringTransactionContext } from '../context/RecurringTransactionContext';
import type { Category, Wallet, RecurringTransaction } from '../types';

interface RecurringTransactionFormProps {
    userId: number;
    wallets: Wallet[];
    categories: Category[];
    onClose: () => void;
    onSuccess: () => void;
    editTransaction?: RecurringTransaction | null;
}

export default function RecurringTransactionForm({
    userId,
    wallets,
    categories,
    onClose,
    onSuccess,
    editTransaction
}: RecurringTransactionFormProps) {
    const recurringTransactionContext = useContext(RecurringTransactionContext);
    if (!recurringTransactionContext) {
        throw new Error('RecurringTransactionForm must be used within RecurringTransactionProvider');
    }

    const { createRecurringTransaction, updateRecurringTransaction } = recurringTransactionContext;
    const [formData, setFormData] = useState({
        walletId: '',
        categoryId: '',
        amount: '',
        type: 'EXPENSE' as 'INCOME' | 'EXPENSE',
        description: '',
        frequency: 'MONTHLY' as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        nextDate: new Date().toISOString().split('T')[0],
        isActive: true,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (editTransaction) {
            // Helper function to safely format date
            const formatDate = (dateValue: string | undefined): string => {
                if (!dateValue) return new Date().toISOString().split('T')[0];

                // If already in YYYY-MM-DD format, return as is
                if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
                    return dateValue;
                }

                // Try to parse and format
                const date = new Date(dateValue);
                if (isNaN(date.getTime())) {
                    return new Date().toISOString().split('T')[0];
                }
                return date.toISOString().split('T')[0];
            };

            // Safely convert IDs, handling null/undefined/NaN
            const safeWalletId = editTransaction.walletId !== null &&
                editTransaction.walletId !== undefined &&
                editTransaction.walletId !== 'NaN'
                ? String(editTransaction.walletId)
                : '';
            const safeCategoryId = editTransaction.categoryId !== null &&
                editTransaction.categoryId !== undefined &&
                editTransaction.categoryId !== 'NaN'
                ? String(editTransaction.categoryId)
                : '';

            setFormData({
                walletId: safeWalletId,
                categoryId: safeCategoryId,
                amount: String(editTransaction.amount),
                type: editTransaction.type,
                description: editTransaction.description,
                frequency: editTransaction.frequency,
                startDate: formatDate(editTransaction.startDate),
                endDate: editTransaction.endDate ? formatDate(editTransaction.endDate) : '',
                nextDate: formatDate(editTransaction.nextDate),
                isActive: editTransaction.isActive,
            });
        }
    }, [editTransaction]);

    // Filter out invalid wallets and categories
    const validWallets = wallets.filter(w => w.id !== null && w.id !== undefined && w.id !== 'NaN' && !Number.isNaN(w.id));
    const validCategories = categories.filter(c => c.id !== null && c.id !== undefined && c.id !== 'NaN' && !Number.isNaN(c.id));
    const filteredCategories = validCategories.filter(c => c.type === formData.type);

    console.log('RecurringTransactionForm - categories:', categories.length);
    console.log('RecurringTransactionForm - validCategories:', validCategories.length);
    console.log('RecurringTransactionForm - filteredCategories:', filteredCategories.length, 'for type:', formData.type);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!formData.walletId || !formData.categoryId || !formData.amount) {
            setError('Vui lòng điền đầy đủ thông tin');
            return;
        }

        // Validate amount for EXPENSE type
        if (formData.type === 'EXPENSE') {
            const selectedWallet = validWallets.find(w => String(w.id) === String(formData.walletId));
            const amount = Number(formData.amount);
            
            if (selectedWallet && amount > selectedWallet.balance) {
                setError(`Số tiền chi tiêu (${amount.toLocaleString('vi-VN')} ₫) vượt quá số dư trong ví (${selectedWallet.balance.toLocaleString('vi-VN')} ₫)`);
                return;
            }
        }

        try {
            setLoading(true);

            if (editTransaction) {
                // Update existing recurring transaction
                await updateRecurringTransaction(editTransaction.id, {
                    walletId: formData.walletId,
                    categoryId: formData.categoryId,
                    amount: Number(formData.amount),
                    type: formData.type,
                    description: formData.description,
                    frequency: formData.frequency,
                    startDate: new Date(formData.startDate).toISOString(),
                    endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
                    nextDate: new Date(formData.nextDate).toISOString(),
                    isActive: formData.isActive,
                });
            } else {
                // Create new recurring transaction
                await createRecurringTransaction({
                    userId,
                    walletId: formData.walletId,
                    categoryId: formData.categoryId,
                    amount: Number(formData.amount),
                    type: formData.type,
                    description: formData.description,
                    frequency: formData.frequency,
                    startDate: new Date(formData.startDate).toISOString(),
                    endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
                    nextDate: new Date(formData.nextDate).toISOString(),
                    isActive: formData.isActive,
                });
            }

            onSuccess();
            onClose();
        } catch (err) {
            setError(editTransaction ? 'Có lỗi xảy ra khi cập nhật giao dịch định kỳ' : 'Có lỗi xảy ra khi tạo giao dịch định kỳ');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">{editTransaction ? 'Sửa thu/chi định kỳ' : 'Thêm thu/chi định kỳ'}</h2>
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
                            {validWallets.map((wallet) => (
                                <option key={wallet.id} value={wallet.id}>
                                    {wallet.name} - {wallet.balance.toLocaleString('vi-VN')} ₫
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Danh mục ({filteredCategories.length} {formData.type === 'INCOME' ? 'thu nhập' : 'chi tiêu'})
                        </label>
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

                    {/* Frequency */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Tần suất</label>
                        <select
                            value={formData.frequency}
                            onChange={(e) => setFormData({
                                ...formData,
                                frequency: e.target.value as typeof formData.frequency
                            })}
                            className="w-full border rounded px-3 py-2"
                            required
                        >
                            <option value="DAILY">Hàng ngày</option>
                            <option value="WEEKLY">Hàng tuần</option>
                            <option value="MONTHLY">Hàng tháng</option>
                            <option value="YEARLY">Hàng năm</option>
                        </select>
                    </div>

                    {/* Start Date */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Ngày bắt đầu</label>
                        <input
                            type="date"
                            value={formData.startDate}
                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                            className="w-full border rounded px-3 py-2"
                            required
                        />
                    </div>

                    {/* Next Date */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Ngày thực hiện tiếp theo</label>
                        <input
                            type="date"
                            value={formData.nextDate}
                            onChange={(e) => setFormData({ ...formData, nextDate: e.target.value })}
                            className="w-full border rounded px-3 py-2"
                            required
                        />
                    </div>

                    {/* End Date (Optional) */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Ngày kết thúc (tùy chọn)</label>
                        <input
                            type="date"
                            value={formData.endDate}
                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                            className="w-full border rounded px-3 py-2"
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

                    {/* Active Status */}
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="isActive"
                            checked={formData.isActive}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            className="mr-2"
                        />
                        <label htmlFor="isActive" className="text-sm font-medium">
                            Kích hoạt ngay
                        </label>
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
