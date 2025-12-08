import { useEffect, useState, useContext } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation('export');
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

  const incomeLabel = t('labels.totalIncome');
  const expenseLabel = t('labels.totalExpense');
  
  const monthlyData: Array<{
    name: string;
    [key: string]: string | number;
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
      [incomeLabel]: monthIncome,
      [expenseLabel]: monthExpense,
    });
  }

  const totalIncome = monthlyData.reduce((sum, m) => sum + (m[incomeLabel] as number || 0), 0);
  const totalExpense = monthlyData.reduce((sum, m) => sum + (m[expenseLabel] as number || 0), 0);
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
      "1month": t('csv.periodLabels.1month'),
      "3months": t('csv.periodLabels.3months'),
      "6months": t('csv.periodLabels.6months'),
      "1year": t('csv.periodLabels.1year'),
      all: t('csv.periodLabels.all'),
    };

    const headers = [
      t('csv.headers.date'),
      t('csv.headers.type'),
      t('csv.headers.category'),
      t('csv.headers.wallet'),
      t('csv.headers.amount'),
      t('csv.headers.description')
    ];
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
        trans.type === "INCOME" ? t('csv.types.income') : t('csv.types.expense'),
        category?.name || "",
        wallet?.name || "",
        trans.amount,
        trans.description || "",
      ];
    });

    const stats = [
      [],
      [t('csv.stats.title', { period: periodLabels[exportPeriod] }), "", "", "", "", ""],
      [t('csv.stats.totalIncome'), "", "", "", periodIncome, ""],
      [t('csv.stats.totalExpense'), "", "", "", periodExpense, ""],
      [t('csv.stats.savings'), "", "", "", periodSavings, ""],
      [t('csv.stats.currentBalance'), "", "", "", currentBalance, ""],
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
      "1month": t('csv.filenameLabels.1month', { month: now.getMonth() + 1, year: now.getFullYear() }),
      "3months": t('csv.filenameLabels.3months'),
      "6months": t('csv.filenameLabels.6months'),
      "1year": t('csv.filenameLabels.1year'),
      all: t('csv.filenameLabels.all'),
    };
    
    const filename = `${filenameLabels[exportPeriod]}.csv`;
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div className="p-4">{t('loading')}</div>;
  }

  return (
    <section className="space-y-6">
      <header className="flex justify-between items-start">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">
            {t('pageTitle')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('pageSubtitle')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={exportPeriod}
            onChange={(e) => setExportPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-white dark:bg-slate-900 dark:text-foreground"
          >
            <option value="1month">{t('dateRanges.1month')}</option>
            <option value="3months">{t('dateRanges.3months')}</option>
            <option value="6months">{t('dateRanges.6months')}</option>
            <option value="1year">{t('dateRanges.1year')}</option>
            <option value="all">{t('dateRanges.all')}</option>
          </select>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 transition-colors"
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
            {t('actions.exportExcel')}
          </button>
        </div>
      </header>

      <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-4 border border-gray-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={goToPreviousMonth}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded text-sm font-medium transition-colors"
            >
              {t('actions.previous')}
            </button>
            <button
              onClick={goToNextMonth}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded text-sm font-medium transition-colors"
            >
              {t('actions.next')}
            </button>
          </div>

          <div className="flex gap-2 items-center">
            <span className="text-sm text-muted-foreground">{t('labels.viewData')}</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-3 py-1.5 border border-gray-300 dark:border-slate-700 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 dark:text-foreground"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                <option key={m} value={m}>
                  {t('labels.month', { number: m })}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-1.5 border border-gray-300 dark:border-slate-700 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 dark:text-foreground"
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
            className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-sm font-medium transition-colors"
          >
            {t('actions.today')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-muted-foreground mb-1">{t('labels.totalIncome')}</div>
              <div className="text-2xl font-bold text-foreground">
                {format(totalIncome)} đ
              </div>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-600 dark:text-green-300"
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

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-muted-foreground mb-1">{t('labels.totalExpense')}</div>
              <div className="text-2xl font-bold text-foreground">
                {format(totalExpense)} đ
              </div>
            </div>
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-red-600 dark:text-red-300"
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

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-muted-foreground mb-1">{t('labels.savings')}</div>
              <div className="text-2xl font-bold text-foreground">
                {format(totalSavings)} đ
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-blue-600 dark:text-blue-300"
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

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-muted-foreground mb-1">{t('labels.currentBalance')}</div>
              <div className="text-2xl font-bold text-foreground">
                {format(currentBalance)} đ
              </div>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/40 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-purple-600 dark:text-purple-300"
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
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-lg font-bold text-foreground mb-4">
            {t('labels.expenseByCategory')}
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
                <div className="text-sm text-muted-foreground mb-2">
                  {t('labels.pieChartDescription')}
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
                <div className="flex items-center justify-center h-64 text-gray-400 dark:text-gray-500">
              {t('labels.noExpenseData')}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-lg font-bold text-foreground mb-4">
            {t('labels.cashFlowTrend')}
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
                  dataKey={incomeLabel}
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
                  dataKey={expenseLabel}
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

      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-lg font-bold text-foreground mb-4">
          {t('labels.recentTransactions')}
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
                  className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-slate-800 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: category?.color + "20" }}
                    >
                      <span style={{ color: category?.color }}>💳</span>
                    </div>
                    <div>
                      <div className="font-medium text-foreground">
                        {trans.description || category?.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {wallet?.name} •{" "}
                        {new Date(trans.date).toLocaleDateString("vi-VN")}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`font-semibold ${
                      trans.type === "INCOME"
                        ? "text-green-600 dark:text-green-300"
                        : "text-red-600 dark:text-red-300"
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
          <div className="text-center text-gray-400 dark:text-gray-500 py-8">
            {t('labels.noTransactions')}
          </div>
        )}

        {filteredTransactions.length > 5 && (
          <div className="flex justify-center mt-4">
            <button
              onClick={() => setShowAllTransactions(!showAllTransactions)}
              className="px-6 py-2 text-sm font-medium text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800/40 transition-colors"
            >
              {showAllTransactions
                ? t('actions.collapse')
                : t('actions.viewMore', { count: filteredTransactions.length - 5 })}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
