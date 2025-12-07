import { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2 } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { RecurringTransactionContext } from '../context/RecurringTransactionContext';
import RecurringTransactionList from '../components/RecurringTransactionList';
import RecurringTransactionForm from '../components/RecurringTransactionForm';
import CategoryQuickCreateForm from '../components/CategoryQuickCreateForm';
import api from '../services/api';
import type { Wallet, Category, RecurringTransaction } from '../types';

interface WalletResponse {
  id: string;
  user_id: number;
  name: string;
  type: string;
  balance: number;
  color: string;
  created_at: string;
}

interface CategoryResponse {
  id: string;
  user_id: number;
  name: string;
  type: string;
  color: string;
  icon: string;
}

export default function Recurring() {
  const { t } = useTranslation('recurring');
  const authContext = useContext(AuthContext);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showRecurringForm, setShowRecurringForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editRecurringTransaction, setEditRecurringTransaction] = useState<RecurringTransaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasProcessedOnMount, setHasProcessedOnMount] = useState(false); // Flag to process only once
  const recurringContext = useContext(RecurringTransactionContext);

  if (!authContext || !authContext.user) {
    return <div>{t('loading')}</div>;
  }

  if (!recurringContext) {
    throw new Error('Recurring page must be used within RecurringTransactionProvider');
  }

  const { user } = authContext;
  const { processRecurringTransactions } = recurringContext;

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('=== RECURRING: Loading data ===');
      const [walletsRes, categoriesRes] = await Promise.all([
        api.get<WalletResponse[]>(`/wallets?user_id=${user.id}`),
        api.get<CategoryResponse[]>(`/categories?user_id=${user.id}`)
      ]);

      // Map snake_case to camelCase
      const mappedWallets = walletsRes.data.map((w: WalletResponse) => ({
        id: w.id, // Keep as string or number
        userId: w.user_id,
        name: w.name,
        type: w.type as "BANK" | "E_WALLET" | "CASH",
        balance: w.balance,
        color: w.color,
        createdAt: w.created_at
      }));

      const mappedCategories = categoriesRes.data.map((c: CategoryResponse) => ({
        id: c.id, // Keep as string or number
        userId: c.user_id,
        name: c.name,
        type: c.type as "INCOME" | "EXPENSE",
        color: c.color,
        icon: c.icon
      }));

      console.log('Wallets loaded:', mappedWallets.length);
      console.log('Categories loaded:', mappedCategories.length);
      setWallets(mappedWallets);
      setCategories(mappedCategories);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  // Process recurring transactions chỉ 1 lần khi component mount lần đầu
  useEffect(() => {
    if (!hasProcessedOnMount) {
      const processRecurring = async () => {
        try {
          console.log('=== RECURRING PAGE: Processing recurring transactions (first time only) ===');
          await processRecurringTransactions(user.id);
          setHasProcessedOnMount(true);
          console.log('=== RECURRING PAGE: Processing complete ===');
          // Reload data sau khi xử lý
          await loadData();
        } catch (error) {
          console.error('=== RECURRING PAGE: Error processing ===', error);
        }
      };
      processRecurring();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array = chỉ chạy 1 lần khi mount

  const handleUpdate = async () => {
    await loadData();
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('⚠️ BẠN CÓ CHẮC CHẮN MUỐN XÓA TẤT CẢ GIAO DỊCH ĐỊNH KỲ?\n\nLưu ý: Thao tác này sẽ xóa tất cả giao dịch định kỳ của bạn và KHÔNG THỂ HOÀN TÁC!')) {
      return;
    }

    // Double confirmation
    if (!window.confirm('Xác nhận lần cuối: Xóa hết tất cả giao dịch định kỳ?')) {
      return;
    }

    try {
      setLoading(true);

      // Get all recurring transactions
      const recurringRes = await api.get(`/recurring_transactions?user_id=${user.id}`);
      const allRecurring = recurringRes.data;

      if (allRecurring.length === 0) {
        alert('Không có giao dịch định kỳ nào để xóa');
        return;
      }

      // Delete all recurring transactions
      let deletedCount = 0;
      for (const rt of allRecurring) {
        await api.delete(`/recurring_transactions/${rt.id}`);
        deletedCount++;
      }

      alert(`✅ Đã xóa thành công ${deletedCount} giao dịch định kỳ`);
      await handleUpdate();
    } catch (error) {
      console.error('Error deleting all recurring transactions:', error);
      alert('❌ Có lỗi xảy ra khi xóa giao dịch định kỳ');
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySuccess = async () => {
    console.log('=== Category created successfully ===');
    setShowCategoryForm(false);

    // Đóng form recurring để reload
    const wasOpen = showRecurringForm;
    if (wasOpen) {
      setShowRecurringForm(false);
    }

    // Just reload data once
    await loadData();
    console.log('=== Data reloaded successfully ===');

    // Mở lại form recurring
    if (wasOpen) {
      setTimeout(() => {
        setShowRecurringForm(true);
      }, 100);
    }
  };

  const handleEditRecurringTransaction = (transaction: RecurringTransaction) => {
    setEditRecurringTransaction(transaction);
    setShowRecurringForm(true);
  };

  const handleCloseRecurringForm = () => {
    setShowRecurringForm(false);
    setEditRecurringTransaction(null);
  };

  const handleRecurringSuccess = () => {
    handleCloseRecurringForm();
    handleUpdate();
  };

  if (loading) {
    return (
      <section className="space-y-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-xl">Đang tải...</div>
        </div>
      </section>
    );
  }

  // Check if user has wallets and categories
  const hasNoData = wallets.length === 0 || categories.length === 0;

  return (
    <section className="space-y-6">
      <header className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
      </header>

      {/* Warning if no wallets or categories */}
      {hasNoData && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex items-start justify-between">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
<path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>{t('warning.title')}</strong>
                  {wallets.length === 0 && categories.length === 0 && ` ${t('warning.noWalletNoCategory')}`}
                  {wallets.length === 0 && categories.length > 0 && ` ${t('warning.noWallet')}`}
                  {wallets.length > 0 && categories.length === 0 && ` ${t('warning.noCategory')}`}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-card rounded-lg shadow p-6 border border-border">
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">{t('summary.totalWallets')}</h3>
                <p className="text-3xl font-bold text-blue-600">{wallets.length}</p>
              </div>
              <div className="bg-card rounded-lg shadow p-6 border border-border">
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">{t('summary.totalBalance')}</h3>
                <p className="text-3xl font-bold text-green-600">
                  {wallets.reduce((sum, w) => sum + w.balance, 0).toLocaleString()} {t('currency')}
                </p>
              </div>
              <div className="bg-card rounded-lg shadow p-6 border border-border">
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">{t('summary.categories')}</h3>
                <p className="text-3xl font-bold text-purple-600">{categories.length}</p>
</div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={handleDeleteAll}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                title="Xóa tất cả giao dịch định kỳ"
              >
                <Trash2 size={18} />
                Xóa hết
              </button>
              <button
                onClick={() => setShowRecurringForm(true)}
                disabled={hasNoData}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${hasNoData
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                title={hasNoData ? t('actions.createWalletFirst') : t('actions.addRecurringTooltip')}
              >
                <Plus size={20} />
                {t('actions.addRecurring')}
              </button>
            </div>

            {/* Recurring Transaction List */}
            {!hasNoData && (
              <RecurringTransactionList
                key={`recurring-list-${categories.length}-${categories.map(c => c.id).join(',')}`}
                userId={user.id}
                wallets={wallets}
                categories={categories}
                onUpdate={handleUpdate}
                onEdit={handleEditRecurringTransaction}
              />
            )}
          </div>

      {/* Recurring Transaction Form Modal */}
      {showRecurringForm && (
        <RecurringTransactionForm
          key={`${wallets.length}-${categories.length}`}
          userId={user.id}
          wallets={wallets}
          categories={categories}
          onClose={handleCloseRecurringForm}
          onSuccess={handleRecurringSuccess}
          editTransaction={editRecurringTransaction}
        />
      )}

      {/* Category Quick Create Form */}
      {showCategoryForm && (
        <CategoryQuickCreateForm
          userId={user.id}
          onClose={() => setShowCategoryForm(false)}
          onSuccess={handleCategorySuccess}
        />
      )}
    </section>
  );
}