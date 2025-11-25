import { useState, useEffect, useContext } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import RecurringTransactionList from '../components/RecurringTransactionList';
import RecurringTransactionForm from '../components/RecurringTransactionForm';
import api from '../services/api';
import type { Wallet, Category, RecurringTransaction } from '../types';

export default function Recurring() {
  const authContext = useContext(AuthContext);

  if (!authContext || !authContext.user) {
    return <div>Vui lòng đăng nhập</div>;
  }

  const { user } = authContext;
  
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showRecurringForm, setShowRecurringForm] = useState(false);
  const [editRecurringTransaction, setEditRecurringTransaction] = useState<RecurringTransaction | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [walletsRes, categoriesRes] = await Promise.all([
        api.get<any[]>(`/wallets?user_id=${user.id}`),
        api.get<any[]>(`/categories?user_id=${user.id}`)
      ]);

      // Map snake_case to camelCase
      const mappedWallets = walletsRes.data.map((w: any) => ({
        id: Number(w.id),
        userId: w.user_id,
        name: w.name,
        type: w.type,
        balance: w.balance,
        color: w.color,
        createdAt: w.created_at
      }));

      const mappedCategories = categoriesRes.data.map((c: any) => ({
        id: Number(c.id),
        userId: c.user_id,
        name: c.name,
        type: c.type,
        color: c.color,
        icon: c.icon
      }));

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
  }, [user.id]);

  const handleUpdate = () => {
    loadData();
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

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-foreground">Thu/Chi định kỳ</h1>
          </div>
          <p className="text-muted-foreground">Quản lý các giao dịch tự động lặp lại theo chu kỳ</p>
        </div>
        <button
          onClick={() => setShowRecurringForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-md"
        >
          <Plus size={20} />
          Thêm thu/chi định kỳ
        </button>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-lg shadow p-6 border border-border">
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">Tổng số ví</h3>
          <p className="text-3xl font-bold text-blue-600">{wallets.length}</p>
        </div>
        <div className="bg-card rounded-lg shadow p-6 border border-border">
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">Tổng số dư</h3>
          <p className="text-3xl font-bold text-green-600">
            {wallets.reduce((sum, w) => sum + w.balance, 0).toLocaleString('vi-VN')} ₫
          </p>
        </div>
        <div className="bg-card rounded-lg shadow p-6 border border-border">
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">Danh mục</h3>
          <p className="text-3xl font-bold text-purple-600">{categories.length}</p>
        </div>
      </div>

      {/* Recurring Transaction List */}
      <RecurringTransactionList
        userId={user.id}
        wallets={wallets}
        categories={categories}
        onUpdate={handleUpdate}
        onEdit={handleEditRecurringTransaction}
      />

      {/* Recurring Transaction Form Modal */}
      {showRecurringForm && (
        <RecurringTransactionForm
          userId={user.id}
          wallets={wallets}
          categories={categories}
          onClose={handleCloseRecurringForm}
          onSuccess={handleRecurringSuccess}
          editTransaction={editRecurringTransaction}
        />
      )}
    </section>
  );
}

