import { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, FolderOpen, RefreshCw } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
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

type TabType = 'recurring' | 'categories';

function CategoryManagementTab({
  categories,
  onUpdate,
  onOpenCategoryForm
}: {
  categories: Category[];
  onUpdate: () => void;
  onOpenCategoryForm: () => void;
}) {
  const { t } = useTranslation('recurring');
  
  const handleDeleteCategory = async (categoryId: number | string, categoryName: string) => {
    const confirmDelete = window.confirm(
      t('categoryManagement.confirmDelete', { name: categoryName })
    );

    if (!confirmDelete) {
      return;
    }

    try {
      await api.delete(`/categories/${categoryId}`);
      alert(t('categoryManagement.deleteSuccess'));
      onUpdate();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert(t('categoryManagement.deleteError'));
    }
  };

  const expenseCategories = categories.filter(c => c.type === 'EXPENSE');
  const incomeCategories = categories.filter(c => c.type === 'INCOME');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{t('categoryManagement.title')}</h2>
        <button
          onClick={onOpenCategoryForm}
          className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 font-semibold text-white hover:bg-purple-700"
        >
          <Plus size={20} />
          {t('categoryManagement.createCategory')}
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Expense Categories */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="mb-4 text-xl font-semibold text-red-500">
            {t('categoryManagement.expense')} ({expenseCategories.length})
          </h3>
          {expenseCategories.length === 0 ? (
            <p className="text-muted-foreground">{t('categoryManagement.noExpenseCategory')}</p>
          ) : (
            <div className="space-y-2">
              {expenseCategories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-background p-3 hover:bg-accent"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{category.name}</span>
</div>
                  <button
                    type="button"
                    onClick={() => {
                      console.log('Button clicked!', category.id, category.name);
                      handleDeleteCategory(category.id, category.name);
                    }}
                    className="rounded-lg p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20"
                    title="Xóa danh mục"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Income Categories */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="mb-4 text-xl font-semibold text-green-500">
            {t('categoryManagement.income')} ({incomeCategories.length})
          </h3>
          {incomeCategories.length === 0 ? (
            <p className="text-muted-foreground">{t('categoryManagement.noIncomeCategory')}</p>
          ) : (
            <div className="space-y-2">
              {incomeCategories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-background p-3 hover:bg-accent"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      console.log('Button clicked!', category.id, category.name);
                      handleDeleteCategory(category.id, category.name);
                    }}
                    className="rounded-lg p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20"
                    title="Xóa danh mục"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Recurring() {
  const { t } = useTranslation('recurring');
  const [searchParams, setSearchParams] = useSearchParams();
  const authContext = useContext(AuthContext);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showRecurringForm, setShowRecurringForm] = useState(false);
  const [editRecurringTransaction, setEditRecurringTransaction] = useState<RecurringTransaction | null>(null);
  const [loading, setLoading] = useState(true);
  const recurringContext = useContext(RecurringTransactionContext);

  if (!authContext || !authContext.user) {
    return <div>{t('loading')}</div>;
  }

  if (!recurringContext) {
    throw new Error('Recurring page must be used within RecurringTransactionProvider');
  }

  const { user } = authContext;
  const { processRecurringTransactions } = recurringContext;



  const [showCategoryForm, setShowCategoryForm] = useState(false);


  // Get active tab from URL params or default to 'recurring'
  const activeTab = (searchParams.get('tab') as TabType) || 'recurring';

  // Function to change tab
  const changeTab = (tab: TabType) => {
    setSearchParams({ tab });
  };

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
        id: Number(w.id),
        userId: w.user_id,
        name: w.name,
        type: w.type as "BANK" | "E_WALLET" | "CASH",
        balance: w.balance,
        color: w.color,
        createdAt: w.created_at
      }));

      const mappedCategories = categoriesRes.data.map((c: CategoryResponse) => ({
        id: Number(c.id),
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
    const initializePage = async () => {
      await loadData();
      // Tự động xử lý giao dịch định kỳ khi vào trang
      try {
        console.log('=== RECURRING PAGE: Processing recurring transactions ===');
        console.log('User ID:', user.id);
        await processRecurringTransactions(user.id);
        console.log('=== RECURRING PAGE: Transactions processed, reloading data ===');
        // Reload data sau khi xử lý
        await loadData();
      } catch (error) {
        console.error('=== RECURRING PAGE: Error processing recurring transactions ===', error);
      }
    };

    initializePage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  const handleUpdate = async () => {
    await loadData();
  };

  const handleCleanupInvalidData = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tất cả giao dịch định kỳ có danh mục đã bị xóa?')) {
      return;
    }

    try {
      setLoading(true);
      const validCategoryIds = categories.map(c => String(c.id));

      // Get all recurring transactions
      const recurringRes = await api.get(`/recurring_transactions?user_id=${user.id}`);
      const allRecurring = recurringRes.data;

      // Find and delete invalid recurring transactions
      let deletedCount = 0;
for (const rt of allRecurring) {
        const categoryId = String(rt.category_id);
        if (!validCategoryIds.includes(categoryId)) {
          await api.delete(`/recurring_transactions/${rt.id}`);
          deletedCount++;
        }
      }

      alert(`Đã xóa ${deletedCount} giao dịch định kỳ không hợp lệ`);
      await handleUpdate();
    } catch (error) {
      console.error('Error cleaning up data:', error);
      alert('Có lỗi xảy ra khi dọn dẹp dữ liệu');
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

  const tabs = [
    { id: 'recurring' as TabType, label: t('tabs.recurring'), icon: RefreshCw },
    { id: 'categories' as TabType, label: t('tabs.categories'), icon: FolderOpen },
  ];

  return (
    <section className="space-y-6">
      <header className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
      </header>

      {/* Warning if no wallets or categories */}
      {hasNoData && activeTab === 'recurring' && (
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

      {/* Tabs Navigation */}
      <div className="flex gap-2 border-b border-border">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => changeTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${activeTab === tab.id
                ? 'border-b-2 border-purple-600 text-purple-600'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              <Icon size={20} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'recurring' && (
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
                onClick={handleCleanupInvalidData}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700"
                title={t('actions.deleteAllTooltip')}
              >
                <Trash2 size={18} />
                {t('actions.deleteAll')}
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
        )}

        {activeTab === 'categories' && (
          <CategoryManagementTab
            categories={categories}
            onUpdate={handleUpdate}
            onOpenCategoryForm={() => setShowCategoryForm(true)}
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