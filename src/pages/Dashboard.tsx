import axios from "axios";
import { Wallet, Loader2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

interface WalletType {
  id: string;
  user_id: number;
  name: string;
  balance: number;
  color: string;
}

interface Transaction {
  id: string;
  user_id: number;
  wallet_id: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  description: string;
  date: string;
  category?: { name: string; icon?: string };
}

export default function Dashboard() {
  const [wallets, setWallets] = useState<WalletType[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [walletsRes, transRes] = await Promise.all([
          axios.get("http://localhost:3001/wallets"),
          axios.get("http://localhost:3001/transactions"),
        ]);
        setWallets(walletsRes.data);
        setTransactions(transRes.data);
        setLoading(false);
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu:", err);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

  const currentUserId = Number(user.id);
  const myWallets = wallets.filter((w) => w.user_id === currentUserId);
  const totalBalance = myWallets.reduce((sum, w) => sum + w.balance, 0);

  const myTransactions = transactions
    .filter((t) => t.user_id === currentUserId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("vi-VN");
  };

  return (
    <section className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-foreground">Tổng quan tài chính</h1>
        <p className="text-muted-foreground">Chào mừng trở lại!</p>
      </header>

      <div className="rounded-2xl border bg-card shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-8 text-white">
          <div className="flex items-center gap-3 mb-4">
            <Wallet className="h-8 w-8" />
            <h2 className="text-2xl font-bold">Tổng số dư tài khoản</h2>
          </div>

          {loading ? (
            <div className="flex items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="text-lg">Đang tải số dư...</span>
            </div>
          ) : (
            <div className="text-4xl font-extrabold tracking-tight">
              {totalBalance.toLocaleString("vi-VN")} đ
            </div>
          )}

          <p className="text-sm opacity-90 mt-3">
            {myWallets.length} ví • Cập nhật vừa xong
          </p>
        </div>

        <div className="p-6 bg-muted/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myWallets.map((wallet) => (
              <div
                key={wallet.id}
                className="flex items-center justify-between p-4 rounded-xl bg-white border shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-3 h-12 rounded-full" style={{ backgroundColor: wallet.color }} />
                  <div>
                    <p className="font-medium">{wallet.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {wallet.balance.toLocaleString("vi-VN")} ₫
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-card shadow-lg">
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-4">Giao dịch gần đây</h3>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : myTransactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Chưa có giao dịch nào</p>
          ) : (
            <div className="space-y-3">
              {myTransactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-2 rounded-full ${t.type === "INCOME" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                        }`}
                    >
                      {t.type === "INCOME" ? (
                        <ArrowUpRight className="h-5 w-5" />
                      ) : (
                        <ArrowDownRight className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{t.description}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(t.date)}</p>
                    </div>
                  </div>
                  <span
                    className={`font-semibold ${t.type === "INCOME" ? "text-green-600" : "text-red-600"
                      }`}
                  >
                    {t.type === "INCOME" ? "+" : "-"}
                    {t.amount.toLocaleString("vi-VN")} đ
                  </span>
                </div>
              ))}
            </div>
          )}

          {myTransactions.length > 0 && (
            <div className="mt-4 text-center">
              <a href="/transactions" className="text-sm text-primary hover:underline">
                Xem tất cả giao dịch →
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}