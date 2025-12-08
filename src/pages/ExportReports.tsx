import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

type Transaction = {
  id: string;
  user_id: string | number;
  wallet_id: string | number;
  category_id: string | number;
  amount: number;
  type: "INCOME" | "EXPENSE";
  description: string;
  date: string;
};

type Category = {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  color: string;
};

type Wallet = {
  id: string | number;
  user_id: number;
  name: string;
  balance: number;
};

export default function ExportReports() {
  const auth = useContext(AuthContext) as any;
  const user = auth?.user;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [exportPeriod, setExportPeriod] = useState<string>("all");

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const loadData = async () => {
      try {
        const [transRes, catRes, walletRes] = await Promise.all([
          api.get<Transaction[]>("/transactions"),
          api.get<Category[]>("/categories"),
          api.get<Wallet[]>("/wallets"),
        ]);

        if (user?.id) {
          const userTransactions = transRes.data.filter(
            (t) => String(t.user_id) === String(user.id)
          );
          const userWallets = walletRes.data.filter(
            (w) => String(w.user_id) === String(user.id)
          );
          setTransactions(userTransactions);
          setCategories(catRes.data);
          setWallets(userWallets);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user?.id]);

  const goToPreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const goToToday = () => {
    setSelectedMonth(new Date().getMonth() + 1);
    setSelectedYear(new Date().getFullYear());
  };

  const monthlyData: Array<{
    name: string;
    "Thu nhập": number;
    "Chi tiêu": number;
  }> = [];

  for (let i = 0; i < 6; i++) {
    let month = selectedMonth - 5 + i;
    let year = selectedYear;

    while (month < 1) {
      month += 12;
      year -= 1;
    }

    while (month > 12) {
      month -= 12;
      year += 1;
    }

    if (year < 2024 || year > 2025) {
      continue;
    }

    const monthLabel = `T${month}/${year}`;

    const monthIncome = transactions
      .filter((t) => {
        const tDate = new Date(t.date);
        return (
          t.type === "INCOME" &&
          tDate.getMonth() === month - 1 &&
          tDate.getFullYear() === year
        );
      })
      .reduce((sum, t) => sum + t.amount, 0);

    const monthExpense = transactions
      .filter((t) => {
        const tDate = new Date(t.date);
        return (
          t.type === "EXPENSE" &&
          tDate.getMonth() === month - 1 &&
          tDate.getFullYear() === year
        );
      })
      .reduce((sum, t) => sum + t.amount, 0);

    monthlyData.push({
      name: monthLabel,
      "Thu nhập": monthIncome,
      "Chi tiêu": monthExpense,
    });
  }

  const totalIncome = monthlyData.reduce((sum, m) => sum + m["Thu nhập"], 0);
  const totalExpense = monthlyData.reduce((sum, m) => sum + m["Chi tiêu"], 0);
  const totalSavings = totalIncome - totalExpense;

  const currentBalance = wallets.reduce((sum, w) => sum + w.balance, 0);

  const filteredTransactions = transactions.filter((t) => {
    const tDate = new Date(t.date);
    const tMonth = tDate.getMonth() + 1;
    const tYear = tDate.getFullYear();

    let startMonth = selectedMonth - 5;
    let startYear = selectedYear;
    while (startMonth < 1) {
      startMonth += 12;
      startYear -= 1;
    }

    const transactionDate = new Date(tYear, tMonth - 1, 1);
    const rangeStart = new Date(startYear, startMonth - 1, 1);
    const rangeEnd = new Date(selectedYear, selectedMonth - 1, 31);

    return transactionDate >= rangeStart && transactionDate <= rangeEnd;
  });

  const expenseCategories = categories.filter((c) => c.type === "EXPENSE");
  const expenseByCategory = expenseCategories
    .map((cat) => {
      const total = filteredTransactions
        .filter(
          (t) =>
            t.type === "EXPENSE" && String(t.category_id) === String(cat.id)
        )
        .reduce((sum, t) => sum + t.amount, 0);
      return { name: cat.name, value: total, color: cat.color };
    })
    .filter((item) => item.value > 0);

  const sortedTransactions = [...filteredTransactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const recentTransactions = showAllTransactions
    ? sortedTransactions
    : sortedTransactions.slice(0, 5);

  const format = (v: number) => v.toLocaleString("vi-VN");

  const getFilteredTransactions = () => {
    const now = new Date();
    const periods: Record<string, number> = {
      "1month": 1,
      "3months": 3,
      "6months": 6,
      "1year": 12,
    };
    const monthsAgo = periods[exportPeriod];

    const filtered = monthsAgo
      ? transactions.filter(
          (t) =>
            new Date(t.date) >=
            new Date(
              now.getFullYear(),
              now.getMonth() - monthsAgo,
              now.getDate()
            )
        )
      : transactions;

    return filtered.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  };

  const exportToCSV = () => {
    const sortedForExport = getFilteredTransactions();
    const periodIncome = sortedForExport
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + t.amount, 0);
    const periodExpense = sortedForExport
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + t.amount, 0);
    const periodSavings = periodIncome - periodExpense;

    const periodLabels: Record<string, string> = {
      "1month": "1 thang",
      "3months": "3 thang",
      "6months": "6 thang",
      "1year": "1 nam",
      all: "Tat ca",
    };

    const headers = ["Ngay", "Loai", "Danh muc", "Vi", "So tien", "Mo ta"];
    const rows = sortedForExport.map((trans) => {
      const category = categories.find(
        (c) => String(c.id) === String(trans.category_id)
      );
      const wallet = wallets.find(
        (w) => String(w.id) === String(trans.wallet_id)
      );
      const date = new Date(trans.date);
      const dateStr = `\t${String(date.getDate()).padStart(2, "0")}/${String(
        date.getMonth() + 1
      ).padStart(2, "0")}/${date.getFullYear()}`;

      return [
        dateStr,
        trans.type === "INCOME" ? "Thu nhap" : "Chi tieu",
        category?.name || "",
        wallet?.name || "",
        trans.amount,
        trans.description || "",
      ];
    });

    const stats = [
      [],
      [`THONG KE (${periodLabels[exportPeriod]})`, "", "", "", "", ""],
      ["Tong thu nhap", "", "", "", periodIncome, ""],
      ["Tong chi tieu", "", "", "", periodExpense, ""],
      ["Tiet kiem", "", "", "", periodSavings, ""],
      ["So du hien tai", "", "", "", currentBalance, ""],
    ];

    const escapeCSV = (cell: any) => {
      const str = String(cell);
      return str.includes(",") || str.includes('"') || str.includes("\n")
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    };

    const csvContent = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) => row.map(escapeCSV).join(",")),
      ...stats.map((row) => row.map(escapeCSV).join(",")),
    ].join("\r\n");

    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    const now = new Date();
    
    const filenameLabels: Record<string, string> = {
      "1month": `Thang-${now.getMonth() + 1}-${now.getFullYear()}`,
      "3months": `Tong-quan-3-thang`,
      "6months": `Tong-quan-6-thang`,
      "1year": `Tong-quan-1-nam`,
      all: "Tat-ca-thu-nhap-chi-tieu",
    };
    
    const filename = `${filenameLabels[exportPeriod]}.csv`;
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div className="p-4">Đang tải...</div>;
  }

  return (
    <section className="space-y-6">
      <header className="flex justify-between items-start">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-gray-900">
            Tổng quan tài chính
          </h1>
          <p className="text-sm text-gray-500">
            Xem tình hình tài chính tổng thể của bạn
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={exportPeriod}
            onChange={(e) => setExportPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
          >
            <option value="1month">1 tháng gần đây</option>
            <option value="3months">3 tháng gần đây</option>
            <option value="6months">6 tháng gần đây</option>
            <option value="1year">1 năm gần đây</option>
            <option value="all">Tất cả</option>
          </select>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Xuất Excel
          </button>
        </div>
      </header>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={goToPreviousMonth}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium transition-colors"
            >
              ← Trước
            </button>
            <button
              onClick={goToNextMonth}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium transition-colors"
            >
              Sau →
            </button>
          </div>

          <div className="flex gap-2 items-center">
            <span className="text-sm text-gray-600">Xem dữ liệu:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                <option key={m} value={m}>
                  Tháng {m}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[2024, 2025].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={goToToday}
            className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium transition-colors"
          >
            Hôm nay
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-gray-500 mb-1">Tổng thu nhập</div>
              <div className="text-2xl font-bold text-gray-900">
                {format(totalIncome)} đ
              </div>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-gray-500 mb-1">Tổng chi tiêu</div>
              <div className="text-2xl font-bold text-gray-900">
                {format(totalExpense)} đ
              </div>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-gray-500 mb-1">Tiết kiệm</div>
              <div className="text-2xl font-bold text-gray-900">
                {format(totalSavings)} đ
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-gray-500 mb-1">Số dư hiện tại</div>
              <div className="text-2xl font-bold text-gray-900">
                {format(currentBalance)} đ
              </div>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Phân loại chi tiêu
          </h3>
          {expenseByCategory.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseByCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {expenseByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => `${format(value)} đ`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col justify-center space-y-3">
                <div className="text-sm text-gray-500 mb-2">
                  Biểu đồ tròn hiển thị phân loại chi tiêu
                </div>
                {expenseByCategory.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span>{item.name}</span>
                    </div>
                    <span className="font-semibold">
                      {format(item.value)} đ
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400">
              Chưa có dữ liệu chi tiêu
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Xu hướng dòng tiền
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={monthlyData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#666", fontSize: 12 }}
                />
                <YAxis
                  tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#666", fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value: number) => `${format(value)} đ`}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                  }}
                />
                <Line
                  type="natural"
                  dataKey="Thu nhập"
                  stroke="#22c55e"
                  strokeWidth={3}
                  dot={{
                    fill: "#22c55e",
                    r: 5,
                    strokeWidth: 2,
                    stroke: "#fff",
                  }}
                  activeDot={{ r: 7 }}
                />
                <Line
                  type="natural"
                  dataKey="Chi tiêu"
                  stroke="#ef4444"
                  strokeWidth={3}
                  dot={{
                    fill: "#ef4444",
                    r: 5,
                    strokeWidth: 2,
                    stroke: "#fff",
                  }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Giao dịch gần đây
        </h3>
        {recentTransactions.length > 0 ? (
          <div className="space-y-3">
            {recentTransactions.map((trans) => {
              const category = categories.find(
                (c) => String(c.id) === String(trans.category_id)
              );
              const wallet = wallets.find(
                (w) => String(w.id) === String(trans.wallet_id)
              );
              return (
                <div
                  key={trans.id}
                  className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: category?.color + "20" }}
                    >
                      <span style={{ color: category?.color }}>💳</span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {trans.description || category?.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {wallet?.name} •{" "}
                        {new Date(trans.date).toLocaleDateString("vi-VN")}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`font-semibold ${
                      trans.type === "INCOME"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {trans.type === "INCOME" ? "+" : "-"}
                    {format(trans.amount)} đ
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-8">
            Chưa có giao dịch nào
          </div>
        )}

        {filteredTransactions.length > 5 && (
          <div className="flex justify-center mt-4">
            <button
              onClick={() => setShowAllTransactions(!showAllTransactions)}
              className="px-6 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              {showAllTransactions
                ? "Thu gọn"
                : `Xem thêm (${filteredTransactions.length - 5} giao dịch)`}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
