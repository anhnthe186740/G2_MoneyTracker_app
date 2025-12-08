import { useState, useContext, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TransactionContext } from '../context/TransactionContext';
import type { Category, Wallet, Transaction } from '../types';
import { checkExpensesWarning, checkLowBalance, checkLargeTransaction } from '../services/notificationService';  // Import các hàm kiểm tra
import { useBudgetContext } from '../context/BudgetContext';
import CurrencyInput from './CurrencyInput';
import DateInput from './DateInput';

interface TransactionFormProps {
    userId: number;
    wallets: Wallet[];
    categories: Category[];
    onClose: () => void;
    onSuccess: () => void;
    editTransaction?: Transaction | null;
    onOpenWalletForm?: () => void;
}

export default function TransactionForm({
    userId,
    wallets,
    categories,
    onClose,
    onSuccess,
    editTransaction,
    onOpenWalletForm
}: TransactionFormProps) {
    const { t } = useTranslation('transactions');
    const transactionContext = useContext(TransactionContext);
    if (!transactionContext) {
        throw new Error('TransactionForm must be used within TransactionProvider');
    }

    const { createTransaction, updateTransaction } = transactionContext;
    const { recheckBudgetsProgress } = useBudgetContext();

    // Filter out invalid wallets and categories
    const validWallets = wallets.filter(w => w.id !== null && w.id !== undefined && w.id !== 'NaN' && !Number.isNaN(w.id));
    const validCategories = categories.filter(c => c.id !== null && c.id !== undefined && c.id !== 'NaN' && !Number.isNaN(c.id));

    // Initialize form data based on edit mode
    const getInitialFormData = () => {
        if (editTransaction) {
            const walletId = editTransaction.walletId !== null && editTransaction.walletId !== undefined && editTransaction.walletId !== 'NaN'
                ? String(editTransaction.walletId)
                : '';
            const categoryId = editTransaction.categoryId !== null && editTransaction.categoryId !== undefined && editTransaction.categoryId !== 'NaN'
                ? String(editTransaction.categoryId)
                : '';

            return {
                walletId,
                categoryId,
                amount: String(editTransaction.amount),
                type: editTransaction.type,
                description: editTransaction.description,
                date: new Date(editTransaction.date).toISOString().split('T')[0],
            };
        }

        return {
            walletId: '',
            categoryId: '',
            amount: '',
            type: 'EXPENSE' as 'INCOME' | 'EXPENSE',
            description: '',
            date: new Date().toISOString().split('T')[0],
        };
    };

    const [formData, setFormData] = useState(getInitialFormData);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Only update form when editTransaction prop changes (on mount)
    useEffect(() => {
        setFormData(getInitialFormData());
    }, [editTransaction?.id]); // Only trigger when transaction ID changes

    const filteredCategories = validCategories.filter(c => c.type === formData.type);

    // Check if user has wallets and categories
    const hasNoWallets = validWallets.length === 0;
    const hasNoCategories = filteredCategories.length === 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!formData.walletId || formData.walletId === '') {
            setError(t('form.selectWallet'));
            return;
        }

        if (!formData.categoryId || formData.categoryId === '') {
            setError(t('form.selectCategory'));
            return;
        }

        if (!formData.amount || formData.amount === '' || Number(formData.amount) <= 0) {
            setError(t('form.validAmount'));
            return;
        }

        // Validate: Chi tiêu không được vượt quá số dư ví
        const amount = Number(formData.amount);
        if (formData.type === 'EXPENSE') {
            const selectedWallet = validWallets.find(w => String(w.id) === String(formData.walletId));
            if (selectedWallet && amount > selectedWallet.balance) {
                setError(t('form.insufficientBalance', { balance: selectedWallet.balance.toLocaleString(), currency: t('currency') }));
                return;
            }
        }

        try {
            setLoading(true);

            // Debug: Log form data
            console.log('=== TRANSACTION FORM SUBMIT ===');
            console.log('formData.walletId:', formData.walletId, typeof formData.walletId);
            console.log('formData.categoryId:', formData.categoryId, typeof formData.categoryId);
            console.log('formData.amount:', formData.amount);
            console.log('formData:', JSON.stringify(formData, null, 2));
            console.log('filteredCategories:', filteredCategories);
            console.log('ALL categories available:', categories.map(c => ({ id: c.id, name: c.name, idType: typeof c.id })));

            // Validate IDs are not empty or "NaN"
            if (!formData.walletId || formData.walletId === 'NaN' || formData.walletId === 'undefined') {
                console.error('Invalid walletId:', formData.walletId);
                setError(t('form.invalidWallet'));
                setLoading(false);
                return;
            }
            if (!formData.categoryId || formData.categoryId === 'NaN' || formData.categoryId === 'undefined') {
                console.error('Invalid categoryId:', formData.categoryId);
                console.error('Available categories:', filteredCategories);
                setError(t('form.invalidCategory'));
                setLoading(false);
                return;
            }

            if (editTransaction) {
                // Cập nhật giao dịch
                await updateTransaction(editTransaction.id, {
                    walletId: formData.walletId as any,
                    categoryId: formData.categoryId as any,
                    amount: amount,
                    type: formData.type,
                    description: formData.description,
                    date: new Date(formData.date).toISOString(),
                });
            } else {
                // Tạo giao dịch mới
                await createTransaction({
                    userId,
                    walletId: formData.walletId as any,
                    categoryId: formData.categoryId as any,
                    amount,
                    type: formData.type,
                    description: formData.description,
                    date: new Date(formData.date).toISOString(),
                });
            }

            // ===== GỬI THÔNG BÁO TỰ ĐỘNG & CẬP NHẬT NGÂN SÁCH SAU KHI LƯU GIAO DỊCH =====
            try {
                const selectedWallet = validWallets.find(w => String(w.id) === String(formData.walletId));

                if (selectedWallet) {
                    // Tính số dư giả định sau giao dịch để kiểm tra ví sắp cạn
                    const newBalance = formData.type === 'EXPENSE'
                        ? selectedWallet.balance - amount
                        : selectedWallet.balance + amount;

                    void checkLowBalance(userId.toString(), {
                        name: selectedWallet.name,
                        balance: newBalance,
                    });
                }

                // Cảnh báo giao dịch chi tiêu lớn (chỉ cho EXPENSE)
                if (formData.type === 'EXPENSE') {
                    void checkLargeTransaction(userId.toString(), {
                        description: formData.description?.trim() ?? '',
                        amount,
                        type: 'EXPENSE',
                    });
                }

                // Cập nhật lại tiến độ các ngân sách ngay sau khi có giao dịch mới
                recheckBudgetsProgress();
            } catch (notifyErr) {
                console.error('Notification error:', notifyErr);
            }

            console.log('=== TRANSACTION CREATED SUCCESSFULLY ===');
            console.log('Transaction saved with categoryId:', formData.categoryId);
            onSuccess();
            onClose();
        } catch (err) {
            console.error('Transaction error:', err);
            setError(editTransaction ? t('form.updateError') : t('form.createError'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl p-6 w-full max-w-md border border-border dark:border-slate-800">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-foreground">{editTransaction ? t('form.editTitle') : t('form.addTitle')}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
                    >
                        <X size={24} />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded dark:bg-red-900/30 dark:text-red-200">
                        {error}
                    </div>
                )}

                {(hasNoWallets || hasNoCategories) && (
                    <div className="mb-4 p-4 bg-yellow-100 text-yellow-800 rounded dark:bg-yellow-900/30 dark:text-yellow-200">
                        <p className="font-semibold mb-2">{t('form.cannotCreate')}</p>
                        {hasNoWallets && <p>{t('form.createWalletFirst')}</p>}
                        {hasNoCategories && <p>{t('form.createCategoryFirst', { type: formData.type === 'INCOME' ? t('form.categoryTypeIncome') : t('form.categoryTypeExpense') })}</p>}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Type */}
                    <div>
                        <label className="block text-sm font-medium mb-2">{t('form.typeLabel')}</label>
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
                                {t('chart.expense')}
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
                                {t('chart.income')}
                            </label>
                        </div>
                    </div>

                    {/* Wallet */}
                    <div>
                        <label className="block text-sm font-medium mb-2">{t('form.walletLabel')}</label>
                        <select
                            value={formData.walletId}
                            onChange={(e) => setFormData({ ...formData, walletId: e.target.value })}
                            className="w-full border rounded px-3 py-2 bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-foreground"
                            required
                        >
                            <option value="">{t('form.walletSelect')}</option>
                            {validWallets.map((wallet) => (
                                <option key={wallet.id} value={wallet.id}>
                                    {wallet.name} - {wallet.balance.toLocaleString()} {t('currency')}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            {t('form.categoryLabel', {
                                count: filteredCategories.length,
                                type: formData.type === 'EXPENSE' ? t('form.categoryTypeExpense') : t('form.categoryTypeIncome')
                            })}
                        </label>
                        <select
                            value={formData.categoryId}
                            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                            className="w-full border rounded px-3 py-2 bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-foreground"
                            required
                            size={filteredCategories.length > 8 ? 8 : undefined}
                        >
                            <option value="">{t('form.categorySelect')}</option>
                            {filteredCategories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Amount */}
                    <div>
                        <label className="block text-sm font-medium mb-2">{t('form.amountLabel')}</label>
                        <CurrencyInput
                            value={formData.amount}
                            onChange={(value) => setFormData({ ...formData, amount: value })}
                            className="w-full border rounded px-3 py-2 bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-foreground"
                            placeholder={t('form.amountPlaceholder')}
                            min={0}
                            required
                        />
                    </div>

                    {/* Date */}
                    <div>
                        <label className="block text-sm font-medium mb-2">{t('form.dateLabel')}</label>
                        <DateInput
                            value={formData.date}
                            onChange={(value) => setFormData({ ...formData, date: value })}
                            className="w-full border rounded px-3 py-2 bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-foreground"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium mb-2">{t('form.descriptionLabel')}</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full border rounded px-3 py-2 bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-foreground"
                            rows={3}
                            placeholder={t('form.descriptionPlaceholder')}
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border rounded hover:bg-gray-50 dark:hover:bg-slate-800 dark:border-slate-700"
                            disabled={loading}
                        >
                            {t('form.cancel')}
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:bg-gray-400"
                            disabled={loading || hasNoWallets || hasNoCategories}
                        >
                            {loading ? t('form.saving') : t('form.save')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
