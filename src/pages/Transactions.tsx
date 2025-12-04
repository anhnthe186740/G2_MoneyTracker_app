import { useState, useEffect, useContext } from 'react';
import { Plus, TrendingUp, BarChart3, Trash2, FolderOpen } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
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
  const handleDeleteCategory = async (categoryId: number | string, categoryName: string) => {
    const confirmDelete = window.confirm(
      `Bạn có chắc chắn muốn xóa danh mục "${categoryName}"?`
    );

    if (!confirmDelete) {
      return;
    }

    try {
      await api.delete(`/categories/${categoryId}`);
      alert('Xóa danh mục thành công');
      onUpdate();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Không thể xóa danh mục');
    }
  };

  const expenseCategories = categories.filter(c => c.type === 'EXPENSE');
  const incomeCategories = categories.filter(c => c.type === 'INCOME');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Quản lý Danh mục</h2>
        <button
          onClick={onOpenCategoryForm}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
        >
          <Plus size={20} />
          Tạo Danh mục
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Expense Categories */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="mb-4 text-xl font-semibold text-red-500">
            Chi tiêu ({expenseCategories.length})
          </h3>
          {expenseCategories.length === 0 ? (
            <p className="text-muted-foreground">Chưa có danh mục chi tiêu</p>
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
            Thu nhập ({incomeCategories.length})
          </h3>
          {incomeCategories.length === 0 ? (
            <p className="text-muted-foreground">Chưa có danh mục thu nhập</p>
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
  const [searchParams, setSearchParams] = useSearchParams();
  const authContext = useContext(AuthContext);

  if (!authContext || !authContext.user) {
    return <div>Vui lòng đăng nhập</div>;
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
    return <div>Vui lòng đăng nhập</div>;
  }

  const { user } = authContext;

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
    if (!window.confirm('Bạn có chắc chắn muốn xóa tất cả giao dịch có danh mục đã bị xóa?')) {
      return;
    }

    try {
      setLoading(true);
      const validCategoryIds = categories.map(c => String(c.id));

      // Get all transactions
      const transactionsRes = await api.get(`/transactions?user_id=${user.id}`);
      const allTransactions = transactionsRes.data;

      // Find and delete invalid transactions
      let deletedCount = 0;
      for (const t of allTransactions) {
        const categoryId = String(t.category_id);
        if (!validCategoryIds.includes(categoryId)) {
          await api.delete(`/transactions/${t.id}`);
          deletedCount++;
        }
      }

      alert(`Đã xóa ${deletedCount} giao dịch không hợp lệ`);
      await handleUpdate();
    } catch (error) {
      console.error('Error cleaning up data:', error);
      alert('Có lỗi xảy ra khi dọn dẹp dữ liệu');
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
          <div className="text-xl">Đang tải...</div>
        </div>
      </section>
    );
  }

  const tabs = [
    { id: 'overview' as TabType, label: 'Tổng quan', icon: BarChart3 },
    { id: 'transactions' as TabType, label: 'Quản lý giao dịch', icon: TrendingUp },
    { id: 'categories' as TabType, label: 'Quản lý danh mục', icon: FolderOpen },
  ];

  // Check if user has wallets and categories
  const hasNoData = wallets.length === 0 || categories.length === 0;

  return (
    <section className="space-y-6">
      <header className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">Quản lý giao dịch</h1>
        </div>
      </header>

      {/* Warning if no wallets or categories */}
      {hasNoData && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Chưa thể thêm giao dịch!</strong>
                {wallets.length === 0 && categories.length === 0 && ' Bạn cần tạo ít nhất một ví và một danh mục (cả Thu nhập và Chi tiêu). Vui lòng click nút "Thêm giao dịch" và sử dụng nút [+] bên cạnh Ví/Danh mục.'}
                {wallets.length === 0 && categories.length > 0 && ' Bạn cần tạo ít nhất một ví. Vui lòng click nút "Thêm giao dịch" và sử dụng nút [+] bên cạnh Ví.'}
                {wallets.length > 0 && categories.length === 0 && ' Bạn cần tạo ít nhất một danh mục (cả Thu nhập và Chi tiêu). Vui lòng click nút "Thêm giao dịch" và sử dụng nút [+] bên cạnh Danh mục.'}
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
                ? 'border-b-2 border-blue-600 text-blue-600'
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
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">Tổng số ví</h3>
                <p className="text-3xl font-bold text-blue-600">{wallets.length}</p>
              </div>
              <div className="bg-card rounded-lg shadow p-6 border border-border">
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">Tổng số dư</h3>
                <p className="text-3xl font-bold text-green-600">
                  {wallets.reduce((sum, w) => sum + Number(w.balance), 0).toLocaleString('vi-VN')} ₫
                </p>
              </div>
              <div className="bg-card rounded-lg shadow p-6 border border-border">
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">Danh mục</h3>
                <p className="text-3xl font-bold text-purple-600">{categories.length}</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mb-6">
              <button
                onClick={handleCleanupInvalidData}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700"
                title="Xóa các giao dịch có danh mục đã bị xóa"
              >
                <Trash2 size={18} />
                Xóa hết
              </button>
              <button
                onClick={() => setShowTransactionForm(true)}
                disabled={hasNoData}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${hasNoData
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                title={hasNoData ? 'Vui lòng tạo ví và danh mục trước' : 'Thêm giao dịch mới'}
              >
                <Plus size={20} />
                Thêm giao dịch
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

