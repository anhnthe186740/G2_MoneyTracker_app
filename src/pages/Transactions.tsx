import { useState, useEffect, useContext } from 'react';
import { Plus, TrendingUp, BarChart3, Trash2, FolderOpen } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../context/AuthContext';
import TransactionList from '../components/TransactionList';
import TransactionForm from '../components/TransactionForm';
import TransactionChart from '../components/TransactionChart';
import WalletQuickCreateForm from '../components/WalletQuickCreateForm';
import CategoryQuickCreateForm from '../components/CategoryQuickCreateForm';
import api from '../services/api';
import type { Wallet, Category, Transaction } from '../types';

type TabType = 'overview' | 'transactions' | 'categories';

// Category Management Tab Component
function CategoryManagementTab({
  categories,
  onUpdate,
  onOpenCategoryForm
}: {
  categories: Category[];
  onUpdate: () => void;
  onOpenCategoryForm: () => void;
}) {
  const { t } = useTranslation('transactions');

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
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
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
                    title={t('categoryManagement.deleteCategory')}
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
                    title={t('categoryManagement.deleteCategory')}
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

export default function Transactions() {
  const { t } = useTranslation('transactions');
  const [searchParams, setSearchParams] = useSearchParams();
  const authContext = useContext(AuthContext);

  if (!authContext || !authContext.user) {
    return <div>{t('pleaseLogin')}</div>;
  }

  const { user } = authContext;

  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showWalletForm, setShowWalletForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);

  // Get active tab from URL params or default to 'overview'
  const activeTab = (searchParams.get('tab') as TabType) || 'overview';

  if (!authContext || !authContext.user) {
    return <div>{t('pleaseLogin')}</div>;
  }


  const loadData = async () => {
    try {
      setLoading(true);
      const [walletsRes, categoriesRes] = await Promise.all([
        api.get<WalletResponse[]>(`/wallets?user_id=${user.id}`),
        api.get<CategoryResponse[]>(`/categories?user_id=${user.id}`)
      ]);

      // Map snake_case to camelCase
      const mappedWallets = walletsRes.data.map((w: any) => ({
        id: w.id, // Keep original ID (string or number)
        userId: w.user_id,
        name: w.name,
        type: w.type as "BANK" | "E_WALLET" | "CASH",
        balance: w.balance,
        color: w.color,
        createdAt: w.created_at
      }));

      const mappedCategories = categoriesRes.data.map((c: any) => ({
        id: c.id, // Keep original ID (string or number)
        userId: c.user_id,
        name: c.name,
        type: c.type as "INCOME" | "EXPENSE",
        color: c.color,
        icon: c.icon
      }));

      console.log('[Transactions] Loaded data:', {
        walletsCount: mappedWallets.length,
        categoriesCount: mappedCategories.length,
        categories: mappedCategories.map(c => ({ id: c.id, idType: typeof c.id, name: c.name }))
      });
      console.log('[Transactions] Setting categories state...');
      setWallets(mappedWallets);
      setCategories(mappedCategories);
      console.log('[Transactions] Categories state set.');
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Function to change tab
  const changeTab = (tab: TabType) => {
    setSearchParams({ tab });
  };

  const handleUpdate = async () => {
    await loadData();
  };

  const handleCleanupInvalidData = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa TẤT CẢ giao dịch? Hành động này không thể hoàn tác!')) {
      return;
    }

    try {
      setLoading(true);

      // Get all transactions for this user
      const transactionsRes = await api.get(`/transactions?user_id=${user.id}`);
      const allTransactions = transactionsRes.data;

      // Calculate total balance change per wallet to validate
      const walletBalanceChanges = new Map<string, { add: number; subtract: number }>();

      for (const tx of allTransactions) {
        if (tx.wallet_id) {
          const walletId = String(tx.wallet_id);
          if (!walletBalanceChanges.has(walletId)) {
            walletBalanceChanges.set(walletId, { add: 0, subtract: 0 });
          }

          const changes = walletBalanceChanges.get(walletId)!;
          const amount = Number(tx.amount);

          // Calculate what will be added back when deleting
          if (tx.type === 'EXPENSE') {
            changes.add += amount; // Money comes back
          } else {
            changes.subtract += amount; // Money goes away
          }
        }
      }

      // Validate that no wallet will have negative balance after deletion
      for (const [walletId, changes] of walletBalanceChanges) {
        try {
          const walletResponse = await api.get(`/wallets?id=${walletId}&user_id=${user.id}`);
          if (walletResponse.data && walletResponse.data.length > 0) {
            const wallet = walletResponse.data[0];
            const currentBalance = Number(wallet.balance);
            const finalBalance = currentBalance + changes.add - changes.subtract;

            if (finalBalance < 0) {
              alert(`Không thể xóa: Ví "${wallet.name}" sẽ có số dư âm (${finalBalance.toLocaleString()} đ) sau khi hoàn tiền`);
              setLoading(false);
              return;
            }
          }
        } catch (error) {
          console.error(`Error validating wallet ${walletId}:`, error);
        }
      }

      // Delete ALL transactions and restore wallet balance
      let deletedCount = 0;
      for (const tx of allTransactions) {
        // Restore wallet balance before deleting
        if (tx.wallet_id) {
          try {
            const walletResponse = await api.get(`/wallets?id=${tx.wallet_id}&user_id=${user.id}`);
            if (walletResponse.data && walletResponse.data.length > 0) {
              const wallet = walletResponse.data[0];
              const currentBalance = Number(wallet.balance);
              const amount = Number(tx.amount);

              // Reverse the transaction: EXPENSE -> add back, INCOME -> subtract back
              const newBalance = tx.type === 'EXPENSE'
                ? currentBalance + amount
                : currentBalance - amount;

              await api.put(`/wallets/${wallet.id}`, { ...wallet, balance: newBalance });
              console.log(`Restored balance for wallet ${wallet.id}: ${currentBalance} -> ${newBalance}`);
            }
          } catch (walletError) {
            console.error(`Error restoring wallet balance for transaction ${tx.id}:`, walletError);
          }
        }

        // Delete transaction
        await api.delete(`/transactions/${tx.id}`);
        deletedCount++;
      }

      alert(`Đã xóa thành công ${deletedCount} giao dịch và hoàn tiền về ví`);
      await handleUpdate();
    } catch (error) {
      console.error('Error deleting all transactions:', error);
      alert('Có lỗi xảy ra khi xóa giao dịch');
    } finally {
      setLoading(false);
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditTransaction(transaction);
    setShowTransactionForm(true);
  };

  const handleCloseTransactionForm = () => {
    setShowTransactionForm(false);
    setEditTransaction(null);
  };

  const handleTransactionSuccess = () => {
    handleCloseTransactionForm();
    handleUpdate();
  };

  const handleWalletSuccess = () => {
    setShowWalletForm(false);
    handleUpdate();
    // Re-open transaction form if it was open
    if (showTransactionForm) {
      // Force re-render will happen via key prop
    }
  };

  const handleCategorySuccess = async () => {
    console.log('[Transactions] Category created successfully');
    setShowCategoryForm(false);

    // Just reload data once
    await loadData();
    console.log('[Transactions] Data reloaded successfully');
  };

  if (loading) {
    return (
      <section className="space-y-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-xl">{t('loading')}</div>
        </div>
      </section>
    );
  }

  const tabs = [
    { id: 'overview' as TabType, label: t('tabs.overview'), icon: BarChart3 },
    { id: 'transactions' as TabType, label: t('tabs.transactions'), icon: TrendingUp },
    { id: 'categories' as TabType, label: t('tabs.categories'), icon: FolderOpen },
  ];

  // Check if user has wallets and categories
  const hasNoData = wallets.length === 0 || categories.length === 0;

  return (
    <section className="space-y-6">
      <header className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
        </div>
      </header>

      {/* Warning if no wallets or categories */}
      {hasNoData && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 dark:bg-yellow-900/30 dark:border-yellow-600/60">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700 dark:text-yellow-200">
                <strong>{t('warning.title')}</strong>
                {wallets.length === 0 && categories.length === 0 && ` ${t('warning.noWalletNoCategory')}`}
                {wallets.length === 0 && categories.length > 0 && ` ${t('warning.noWallet')}`}
                {wallets.length > 0 && categories.length === 0 && ` ${t('warning.noCategory')}`}
              </p>
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
                ? 'border-b-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-300'
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
        {activeTab === 'overview' && (
          <div className="space-y-6" key={`overview-${wallets.reduce((sum, w) => sum + w.balance, 0)}`}>
            <TransactionChart userId={user.id} key={`chart-${Date.now()}`} />
          </div>
        )}

        {activeTab === 'transactions' && (
          <div>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-card rounded-lg shadow p-6 border border-border">
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">{t('summary.totalWallets')}</h3>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-300">{wallets.length}</p>
              </div>
              <div className="bg-card rounded-lg shadow p-6 border border-border">
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">{t('summary.totalBalance')}</h3>
                <p className="text-3xl font-bold text-green-600 dark:text-green-300">
                  {wallets.reduce((sum, w) => sum + Number(w.balance), 0).toLocaleString()} {t('currency')}
                </p>
              </div>
              <div className="bg-card rounded-lg shadow p-6 border border-border">
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">{t('summary.categories')}</h3>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-300">{categories.length}</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mb-6">
              <button
                onClick={handleCleanupInvalidData}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600"
                title={t('cleanup.confirm')}
              >
                <Trash2 size={18} />
                {t('actions.deleteAll')}
              </button>
              <button
                onClick={() => setShowTransactionForm(true)}
                disabled={hasNoData}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${hasNoData
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
                  }`}
                title={hasNoData ? t('actions.createWalletFirst') : t('actions.addTransaction')}
              >
                <Plus size={20} />
                {t('actions.addTransaction')}
              </button>
            </div>

            <TransactionList
              key={`transaction-list-${categories.length}-${categories.map(c => c.id).join(',')}`}
              userId={user.id}
              wallets={wallets}
              categories={categories}
              onUpdate={handleUpdate}
              onEdit={handleEditTransaction}
            />

            {showTransactionForm && (
              <TransactionForm
                key={`${wallets.length}-${categories.length}`}
                userId={user.id}
                wallets={wallets}
                categories={categories}
                onClose={handleCloseTransactionForm}
                onSuccess={handleTransactionSuccess}
                editTransaction={editTransaction}
                onOpenWalletForm={() => setShowWalletForm(true)}
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

      {/* Quick Create Forms */}
      {showWalletForm && (
        <WalletQuickCreateForm
          userId={user.id}
          onClose={() => setShowWalletForm(false)}
          onSuccess={handleWalletSuccess}
        />
      )}
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
