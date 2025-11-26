import { useState, useEffect, useContext } from 'react';
import { Plus, TrendingUp, Calendar, BarChart3, ArrowLeft } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import TransactionList from '../components/TransactionList';
import TransactionForm from '../components/TransactionForm';
import RecurringTransactionList from '../components/RecurringTransactionList';
import RecurringTransactionForm from '../components/RecurringTransactionForm';
import TransactionChart from '../components/TransactionChart';
import api from '../services/api';
import type { Wallet, Category, Transaction, RecurringTransaction } from '../types';

type TabType = 'overview' | 'transactions' | 'recurring';

export default function TransactionManagement() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const authContext = useContext(AuthContext);

    if (!authContext || !authContext.user) {
        return <div>Vui lòng đăng nhập</div>;
    }

    const { user } = authContext;
    
    const [wallets, setWallets] = useState<Wallet[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [showTransactionForm, setShowTransactionForm] = useState(false);
    const [showRecurringForm, setShowRecurringForm] = useState(false);
    const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);
    const [editRecurringTransaction, setEditRecurringTransaction] = useState<RecurringTransaction | null>(null);
    const [loading, setLoading] = useState(true);
    
    // Get active tab from URL params or default to 'overview'
    const activeTab = (searchParams.get('tab') as TabType) || 'overview';

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

    // Function to change tab
    const changeTab = (tab: TabType) => {
        setSearchParams({ tab });
    };

    const handleUpdate = () => {
        loadData();
    };

    const handleEditTransaction = (transaction: Transaction) => {
        setEditTransaction(transaction);
        setShowTransactionForm(true);
    };

    const handleEditRecurringTransaction = (transaction: RecurringTransaction) => {
        setEditRecurringTransaction(transaction);
        setShowRecurringForm(true);
    };

    const handleCloseTransactionForm = () => {
        setShowTransactionForm(false);
        setEditTransaction(null);
    };

    const handleCloseRecurringForm = () => {
        setShowRecurringForm(false);
        setEditRecurringTransaction(null);
    };

    const handleTransactionSuccess = () => {
        handleCloseTransactionForm();
        handleUpdate();
    };

    const handleRecurringSuccess = () => {
        handleCloseRecurringForm();
        handleUpdate();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-xl">Đang tải...</div>
            </div>
        );
    }

    const tabs = [
        { id: 'overview' as TabType, label: 'Tổng quan', icon: BarChart3 },
        { id: 'transactions' as TabType, label: 'Quản lý giao dịch', icon: TrendingUp },
        { id: 'recurring' as TabType, label: 'Thu/Chi định kỳ', icon: Calendar },
    ];

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-6">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                        >
                            <ArrowLeft size={20} />
                            Quay lại Dashboard
                        </button>
                    </div>

                    <h1 className="text-3xl font-bold mb-6">Quản lý giao dịch</h1>

                    {/* Tabs Navigation */}
                    <div className="flex gap-2 border-b border-gray-300">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => changeTab(tab.id)}
                                    className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${activeTab === tab.id
                                            ? 'border-b-2 border-blue-600 text-blue-600'
                                            : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    <Icon size={20} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Tab Content */}
                <div>
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            <TransactionChart userId={user.id} />

                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white rounded-lg shadow p-6">
                                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Tổng số ví</h3>
                                    <p className="text-3xl font-bold text-blue-600">{wallets.length}</p>
                                </div>
                                <div className="bg-white rounded-lg shadow p-6">
                                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Tổng số dư</h3>
                                    <p className="text-3xl font-bold text-green-600">
                                        {wallets.reduce((sum, w) => sum + w.balance, 0).toLocaleString('vi-VN')} ₫
                                    </p>
                                </div>
                                <div className="bg-white rounded-lg shadow p-6">
                                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Danh mục</h3>
                                    <p className="text-3xl font-bold text-purple-600">{categories.length}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'transactions' && (
                        <div>
                            <div className="flex justify-end mb-6">
                                <button
                                    onClick={() => setShowTransactionForm(true)}
                                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                                >
                                    <Plus size={20} />
                                    Thêm giao dịch
                                </button>
                            </div>
                            <TransactionList
                                userId={user.id}
                                wallets={wallets}
                                categories={categories}
                                onUpdate={handleUpdate}
                                onEdit={handleEditTransaction}
                            />
                        </div>
                    )}

                    {activeTab === 'recurring' && (
                        <div>
                            <div className="flex justify-end mb-6">
                                <button
                                    onClick={() => setShowRecurringForm(true)}
                                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                                >
                                    <Plus size={20} />
                                    Thêm thu/chi định kỳ
                                </button>
                            </div>
                            <RecurringTransactionList
                                userId={user.id}
                                wallets={wallets}
                                categories={categories}
                                onUpdate={handleUpdate}
                                onEdit={handleEditRecurringTransaction}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Transaction Form Modal */}
            {showTransactionForm && (
                <TransactionForm
                    userId={user.id}
                    wallets={wallets}
                    categories={categories}
                    onClose={handleCloseTransactionForm}
                    onSuccess={handleTransactionSuccess}
                    editTransaction={editTransaction}
                />
            )}

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
        </div>
    );
}
