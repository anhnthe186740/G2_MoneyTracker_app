import axios from "axios";
import { Wallet, Loader2, Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

interface WalletType {
  id: string;
  user_id: number | string;
  name: string;
  balance: number;
  color: string;
}

interface TransactionType {
  id: string;
  user_id: string | number;
  amount: number;
  type: "INCOME" | "EXPENSE";
}

export default function Dashboard() {
  const [wallets, setWallets] = useState<WalletType[]>([]);
  const [transactions, setTransactions] = useState<TransactionType[]>([]);
  const [loading, setLoading] = useState(true);

  const [hideBalance, setHideBalance] = useState(true);
  const [visibleWallets, setVisibleWallets] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [walletsRes, transactionsRes] = await Promise.all([
          axios.get("http://localhost:3001/wallets"),
          axios.get("http://localhost:3001/transactions"),
        ]);

        setWallets(walletsRes.data);
        setTransactions(transactionsRes.data);
        setLoading(false);
      } catch (err) {
        console.error("Lỗi khi lấy dữ liệu:", err);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const { user } = useAuth();

  if (!user) {
    return (
      <section className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-2xl font-semibold text-muted-foreground">
            Vui lòng đăng nhập để xem thông tin tài chính
          </p>
        </div>
      </section>
    );
  }

  const userIdStr = String(user.id);

  const myWallets = wallets.filter(
    (wallet) => String(wallet.user_id) === userIdStr
  );

  const totalBalance = myWallets.reduce((sum, wallet) => sum + wallet.balance, 0);

  const myTransactions = transactions.filter(
    (t) => String(t.user_id) === userIdStr
  );

  const totalIncome = myTransactions
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = myTransactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + t.amount, 0);

  const toggleWalletVisibility = (walletId: string) => {
    const newVisible = new Set(visibleWallets);
    if (newVisible.has(walletId)) {
      newVisible.delete(walletId);
    } else {
      newVisible.add(walletId);
    }
    setVisibleWallets(newVisible);
  };

  const formatBalance = (amount: number, isHidden: boolean = false) => {
    if (isHidden) {
      return "•••••••• đ";
    }
    return amount.toLocaleString("vi-VN") + " đ";
  };

  const formatMoney = (amount: number) =>
    amount.toLocaleString("vi-VN") + " đ";

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-foreground">Tổng quan tài chính</h1>
        <p className="text-muted-foreground">Chào mừng bạn trở lại!</p>
      </header>

      <div className="rounded-2xl border bg-card shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-8 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Wallet className="h-8 w-8" />
              <h2 className="text-2xl font-bold">Tổng số dư tài khoản</h2>
            </div>

            <button
              onClick={() => setHideBalance(!hideBalance)}
              className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition"
            >
              {hideBalance ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
            </button>
          </div>

          {loading ? (
            <div className="flex items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="text-lg">Đang tải số dư...</span>
            </div>
          ) : (
            <div className="text-4xl font-extrabold tracking-tight">
              {hideBalance ? "•••••••• đ" : `${totalBalance.toLocaleString("vi-VN")} đ`}
            </div>
          )}

          <p className="text-sm opacity-90 mt-3">
            {myWallets.length} ví • Cập nhật vừa xong
          </p>
        </div>

        <div className="p-6 bg-muted/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myWallets.map((wallet) => {
              const isVisible = visibleWallets.has(wallet.id);

              return (
                <div
                  key={wallet.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-white border shadow-sm hover:shadow transition"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-12 rounded-full"
                      style={{ backgroundColor: wallet.color }}
                    />
                    <div>
                      <p className="font-medium">{wallet.name}</p>
                      <p className="text-lg font-semibold text-foreground">
                        {formatBalance(wallet.balance, !isVisible)}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleWalletVisibility(wallet.id)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition"
                  >
                    {isVisible ? (
                      <Eye className="h-5 w-5 text-gray-500" />
                    ) : (
                      <EyeOff className="h-5 w-5 text-gray-500" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8 pt-6 border-t">
            <div className="bg-green-50 rounded-xl p-6 border border-green-200">
              <p className="text-green-700 font-medium mb-2">Tổng thu nhập</p>
              <p className="text-3xl font-bold text-green-600">
                {formatMoney(totalIncome)}
              </p>
            </div>

            <div className="bg-red-50 rounded-xl p-6 border border-red-200">
              <p className="text-red-700 font-medium mb-2">Tổng chi tiêu</p>
              <p className="text-3xl font-bold text-red-600">
                {formatMoney(totalExpense)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}