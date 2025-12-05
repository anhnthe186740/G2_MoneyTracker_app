import axios from "axios";
import { Wallet, Loader2, Eye, EyeOff, Target, Calendar } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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
  date: string;
  category_id: string | null;
}

interface CategoryType {
  id: string;
  user_id: string | number;
  name: string;
  type: "INCOME" | "EXPENSE";
  color: string;
}

interface GoalType {
  id: string;
  user_id: string | number;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string;
}

export default function Dashboard() {
  const [wallets, setWallets] = useState<WalletType[]>([]);
  const [transactions, setTransactions] = useState<TransactionType[]>([]);
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [goals, setGoals] = useState<GoalType[]>([]);
  const [loading, setLoading] = useState(true);

  const [hideBalance, setHideBalance] = useState(true);
  const [visibleWallets, setVisibleWallets] = useState<Set<string>>(new Set());

  const [period, setPeriod] = useState<"month" | "6months" | "year">("month");

  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [wRes, tRes, cRes, gRes] = await Promise.all([
          axios.get("http://localhost:3001/wallets"),
          axios.get("http://localhost:3001/transactions"),
          axios.get("http://localhost:3001/categories"),
          axios.get("http://localhost:3001/goals"),
        ]);

        setWallets(wRes.data);
        setTransactions(tRes.data);
        setCategories(cRes.data);
        setGoals(gRes.data);
        setLoading(false);
      } catch (err) {
        console.error("Lỗi khi lấy dữ liệu:", err);
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

  const userIdStr = String(user.id);

  const myWallets = wallets.filter((w) => String(w.user_id) === userIdStr);
  const myTransactions = transactions.filter((t) => String(t.user_id) === userIdStr);
  const myCategories = categories.filter((c) => String(c.user_id) === userIdStr);
  const myGoals = goals.filter((g) => String(g.user_id) === userIdStr);

  const totalBalance = myWallets.reduce((sum, w) => sum + w.balance, 0);

  const getStartDate = () => {
    const now = new Date();
    switch (period) {
      case "month":
        return new Date(now.getFullYear(), now.getMonth(), 1);
      case "6months":
        return new Date(now.getFullYear(), now.getMonth() - 5, 1);
      case "year":
        return new Date(now.getFullYear(), 0, 1);
      default:
        return new Date(now.getFullYear(), now.getMonth(), 1);
    }
  };

  const filteredTransactions = myTransactions.filter(
    (t) => new Date(t.date) >= getStartDate()
  );

  const totalIncome = filteredTransactions
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = filteredTransactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + t.amount, 0);

  const toggleWalletVisibility = (walletId: string) => {
    setVisibleWallets((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(walletId)) {
        newSet.delete(walletId);
      } else {
        newSet.add(walletId);
      }
      return newSet;
    });
  };

  const formatMoney = (amount?: number | null): string => {
    if (amount === null || amount === undefined || isNaN(Number(amount))) {
      return "0 đ";
    }
    return Number(amount).toLocaleString("vi-VN") + " đ";
  };

  const getPeriodLabel = () => {
    switch (period) {
      case "month":
        return `Tháng ${new Date().getMonth() + 1}/${new Date().getFullYear()}`;
      case "6months":
        return "6 tháng gần nhất";
      case "year":
        return `Năm ${new Date().getFullYear()}`;
      default:
        return "";
    }
  };

  const expenseByCategory = myCategories
    .filter((cat) => cat.type === "EXPENSE")
    .map((cat) => {
      const total = filteredTransactions
        .filter((t) => t.type === "EXPENSE" && t.category_id === cat.id)
        .reduce((sum, t) => sum + t.amount, 0);
      return {
        name: cat.name,
        value: total,
        color: cat.color || "#94a3b8",
      };
    })
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getDeadlineStatus = (deadline: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(deadline);
    due.setHours(0, 0, 0, 0);

    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: "Đã quá hạn", color: "text-red-600" };
    if (diffDays === 0) return { text: "Hôm nay", color: "text-orange-600" };
    if (diffDays <= 7) return { text: `Còn ${diffDays} ngày`, color: "text-orange-500" };
    if (diffDays <= 30) return { text: `Còn ${diffDays} ngày`, color: "text-yellow-600" };
    return { text: formatDate(deadline), color: "text-muted-foreground" };
  };

  return (
    <section className="space-y-8">
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
              <span className="text-lg">Đang tải...</span>
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
                    <div className="w-3 h-12 rounded-full" style={{ backgroundColor: wallet.color }} />
                    <div>
                      <p className="font-medium">{wallet.name}</p>
                      <p className="text-lg font-semibold">
                        {isVisible
                          ? wallet.balance.toLocaleString("vi-VN") + " đ"
                          : "•••••••• đ"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleWalletVisibility(wallet.id)}
                    className="p-2 rounded-lg hover:bg-gray-100"
                  >
                    {isVisible ? <Eye className="h-5 w-5 text-gray-500" /> : <EyeOff className="h-5 w-5 text-gray-500" />}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-8 pt-6 border-t">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Thu chi {getPeriodLabel()}</h3>
              <div className="flex gap-2 flex-wrap">
                {(["month", "6months", "year"] as const).map((key) => (
                  <button
                    key={key}
                    onClick={() => setPeriod(key)}
                    className={`px-3 py-1.5 text-sm rounded-lg font-medium transition ${period === key
                      ? "bg-primary text-white"
                      : "bg-muted hover:bg-muted/80 text-muted-foreground"
                      }`}
                  >
                    {key === "month" ? "Tháng này" : key === "6months" ? "6 tháng" : "Năm nay"}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                <p className="text-green-700 font-medium mb-2">Tổng thu nhập</p>
                <p className="text-3xl font-bold text-green-600">{formatMoney(totalIncome)}</p>
              </div>
              <div className="bg-red-50 rounded-xl p-6 border border-red-200">
                <p className="text-red-700 font-medium mb-2">Tổng chi tiêu</p>
                <p className="text-3xl font-bold text-red-600">{formatMoney(totalExpense)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-card border rounded-2xl p-5 shadow-lg">
          <h3 className="text-lg font-semibold text-center mb-4">
            Chi tiêu theo danh mục {getPeriodLabel()}
          </h3>

          {expenseByCategory.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={expenseByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {expenseByCategory.map((entry, i) => (
                      <Cell key={`cell-${i}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatMoney(v)} />
                </PieChart>
              </ResponsiveContainer>

              <div className="space-y-2.5">
                {expenseByCategory.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between py-1.5"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm font-medium truncate max-w-36">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-muted-foreground">
                      {formatMoney(item.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-10">Chưa có chi tiêu trong kỳ</p>
          )}
        </div>

        <div className="bg-card border rounded-2xl p-5 shadow-lg">
          <h3 className="text-lg font-semibold mb-4 flex items-center justify-center gap-2">
            <Target className="w-5 h-5" />
            Tiến độ mục tiêu tài chính
          </h3>

          {myGoals.length > 0 ? (
            <div className="space-y-5">
              {myGoals.map((goal) => {
                const percent = Math.min(
                  Math.round((goal.current_amount / goal.target_amount) * 100),
                  100
                );
                const { text: deadlineText, color: deadlineColor } = getDeadlineStatus(goal.deadline);

                return (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold text-base leading-tight">
                          {goal.name}
                        </p>
                        <p className={`text-xs ${deadlineColor} flex items-center gap-1 mt-0.5`}>
                          <Calendar className="w-3.5 h-3.5" />
                          {deadlineText}
                        </p>
                      </div>
                      <span className="text-lg font-bold text-primary ml-3">{percent}%</span>
                    </div>

                    <div className="w-full bg-muted rounded-full h-9 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-end pr-3 text-white font-bold text-sm transition-all duration-1000"
                        style={{ width: `${percent}%` }}
                      >
                        {percent > 25 && `${percent}%`}
                      </div>
                    </div>

                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{formatMoney(goal.current_amount)}</span>
                      <span>{formatMoney(goal.target_amount)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-10">Chưa có mục tiêu nào</p>
          )}
        </div>
      </div>
    </section>
  );
}