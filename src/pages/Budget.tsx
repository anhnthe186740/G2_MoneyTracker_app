import {
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../context/AuthContext';
import { useBudgetContext } from '../context/BudgetContext';
import { useCategoryContext } from '../context/CategoryContext';
import type { Budget } from '../types';
import BudgetModal from '../components/BudgetModal';

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString();
};

type FilterStatus = 'ALL' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

const todayStart = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const calcDaysLeft = (end_date?: string | null) => {
  if (!end_date) return null;
  const end = new Date(end_date);
  if (Number.isNaN(end.getTime())) return null;
  const diffMs = end.getTime() - todayStart().getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
};

// Normalize date về 00:00:00 để so sánh chính xác
const normalizeDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  try {
    // Nếu là format YYYY-MM-DD, parse trực tiếp
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [year, month, day] = dateStr.split('-').map(Number);
      const d = new Date(year, month - 1, day);
      d.setHours(0, 0, 0, 0);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    // Nếu là ISO string hoặc format khác, parse rồi normalize
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return null;
    d.setHours(0, 0, 0, 0);
    return d;
  } catch {
    return null;
  }
};

// Xác định trạng thái thời gian của ngân sách
const getTimeStatus = (start_date?: string | null, end_date?: string | null) => {
  const today = todayStart();
  const start = start_date ? normalizeDate(start_date) : null;
  const end = end_date ? normalizeDate(end_date) : null;

  // Kiểm tra chưa bắt đầu: ngày hôm nay < ngày bắt đầu
  if (start && today < start) {
    const daysUntilStart = Math.floor((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return { status: 'NOT_STARTED' as const, daysUntilStart };
  }

  // Kiểm tra đã quá hạn: ngày hôm nay > ngày kết thúc
  if (end && today > end) {
    const daysOverdue = Math.floor((today.getTime() - end.getTime()) / (1000 * 60 * 60 * 24));
    return { status: 'EXPIRED' as const, daysOverdue };
  }

  // Còn lại là đang hoạt động (bao gồm cả trường hợp hôm nay = ngày bắt đầu hoặc kết thúc)
  const daysLeft = calcDaysLeft(end_date);
  return { status: 'ACTIVE' as const, daysLeft };
};

export default function BudgetPage() {
  const { t } = useTranslation('budget');
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('Budget page must be used inside AuthProvider');
  const { user } = auth;

  const formatCurrency = (value: number) => 
    `${value.toLocaleString()} ${t('currency')}`;

  const {
    budgets,
    getBudgets,
    updateBudget,
    deleteBudget,
    budgetProgress,
  } = useBudgetContext();

  const { categories } = useCategoryContext();

  // Filter only EXPENSE categories for budget selection
  const expenseCategories = useMemo(
    () => categories.filter((cat) => cat.type === 'EXPENSE'),
    [categories]
  );

  // Lấy categoryId từ object Budget (hỗ trợ cả category_id & categoryId từ backend)
  const getBudgetCategoryId = (b: Budget): number | string | null => {
    const anyBudget = b as any;
    const raw =
      anyBudget.category_id ??
      anyBudget.categoryId ??
      anyBudget.category_id_fk ??
      null;

    if (raw === '' || raw === undefined) return null;
    return raw;
  };

  // Helper to get category name from Budget
  const getCategoryName = (budget: Budget) => {
    const categoryId = getBudgetCategoryId(budget);

    // Trường hợp dữ liệu cũ / lỗi không có categoryId
    if (categoryId === null) {
      return t('labels.categoryUnknown');
    }

    // Dùng so sánh lỏng để tránh lệch kiểu string / number
    const category = categories.find((cat) => cat.id == categoryId);

    // Nếu không tìm thấy, có thể là danh mục đã bị xóa
    if (!category) {
      return t('labels.categoryDeleted');
    }

    return category.name;
  };


  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ACTIVE');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  // Load budgets khi có user
  useEffect(() => {
    if (user?.id) {
      void getBudgets(user.id);
    }
  }, [user?.id, getBudgets]);

  // Thống kê tổng quan
  const summary = useMemo(() => {
    const total = budgets.length;
    const activeLogical = budgets.filter((b) => {
      if (b.status !== 'ACTIVE') return false;
      if (!b.end_date) return true;
      return new Date(b.end_date).getTime() >= todayStart().getTime();
    }).length;

    const totalLimit = budgets.reduce(
      (sum, b) => sum + (b.limit_amount ?? 0),
      0
    );

    return { total, activeLogical, totalLimit };
  }, [budgets]);

  const handleAddBudget = () => {
    setEditingBudget(null);
    setIsModalOpen(true);
  };

  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBudget(null);
  };

  const handleCancelBudget = async (budget: Budget) => {
    if (budget.status !== 'ACTIVE') return;
    const ok = window.confirm(
      t('confirm.cancel', { category: getCategoryName(budget) })
    );
    if (!ok) return;
    try {
      await updateBudget(budget.id, { status: 'CANCELLED' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBudget = async (budget: Budget) => {
    const ok = window.confirm(t('confirm.delete'));
    if (!ok) return;
    try {
      await deleteBudget(budget.id);
    } catch (err) {
      console.error(err);
    }
  };

  // Chuẩn hóa trạng thái hiển thị theo ngày kết thúc + trạng thái backend
  const normalizeStatus = (b: Budget): FilterStatus => {
    // Nếu backend trả về CANCELLED thì luôn ưu tiên trạng thái này
    if (b.status === 'CANCELLED') return 'CANCELLED';

    const daysLeft = calcDaysLeft(b.end_date);

    // Nếu backend đánh dấu COMPLETED thì hiển thị như "Hết hạn"
    if (b.status === 'COMPLETED') {
      return 'EXPIRED';
    }

    // Mặc định là ACTIVE, nhưng nếu đã quá ngày kết thúc thì xem như EXPIRED
    if (b.status === 'ACTIVE') {
      if (daysLeft !== null && daysLeft < 0) return 'EXPIRED';
      return 'ACTIVE';
    }

    // Fallback an toàn (không nên rơi vào nhánh này)
    return 'ACTIVE';
  };

  const sortedBudgets = useMemo(
    () =>
      [...budgets].sort(
        (a, b) =>
          new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
      ),
    [budgets]
  );

  const filteredBudgets = useMemo(
    () =>
      sortedBudgets.filter((b) => {
        const st = normalizeStatus(b);
        if (statusFilter === 'ALL') return true;
        return st === statusFilter;
      }),
    [sortedBudgets, statusFilter]
  );

  return (
    <section className="space-y-6">
      {/* Header */}
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {t('title')}
        </h1>
      </header>

      {/* Cards tổng quan */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Card 1 */}
        <div className="group relative overflow-hidden rounded-2xl border bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 p-6 shadow-lg transition-all hover:shadow-xl">
          <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-blue-200/30 blur-2xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                {t('summary.totalBudgets')}
              </p>
              <svg className="h-8 w-8 text-blue-500/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="mt-4 text-4xl font-bold text-blue-900 dark:text-blue-100">
              {summary.total}
            </p>

          </div>
        </div>

        {/* Card 2 */}
        <div className="group relative overflow-hidden rounded-2xl border bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 p-6 shadow-lg transition-all hover:shadow-xl">
          <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-emerald-200/30 blur-2xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                {t('summary.active')}
              </p>
              <svg className="h-8 w-8 text-emerald-500/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="mt-4 text-4xl font-bold text-emerald-900 dark:text-emerald-100">
              {summary.activeLogical}
            </p>

          </div>
        </div>

        {/* Card 3 */}
        <div className="group relative overflow-hidden rounded-2xl border bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950 dark:to-purple-950 p-6 shadow-lg transition-all hover:shadow-xl">
          <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-violet-200/30 blur-2xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-300">
                {t('summary.totalLimit')}
              </p>
              <svg className="h-8 w-8 text-violet-500/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="mt-4 text-3xl font-bold text-violet-900 dark:text-violet-100">
              {summary.totalLimit ? formatCurrency(summary.totalLimit) : '—'}
            </p>

          </div>
        </div>
      </div>

      {/* Danh sách ngân sách - Always Visible */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-card to-card/50 p-6 shadow-xl">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                {t('currentBudgets')}
              </h2>

            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleAddBudget}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>{t('actions.addBudget')}</span>
            </button>


            <div className="inline-flex rounded-full bg-muted p-1 text-xs">
              {(
                [
                  ['ALL', t('filter.all')],
                  ['ACTIVE', t('filter.active')],
                  ['EXPIRED', t('filter.expired')],
                  ['CANCELLED', t('filter.cancelled')],
                ] as [FilterStatus, string][]
              ).map(([value, label]) => {
                const active = statusFilter === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setStatusFilter(value)}
                    className={`rounded-full px-3 py-1 font-medium transition
    ${active
                        ? 'bg-[rgb(99_102_241)] text-white shadow-sm dark:bg-blue-600'
                        : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    {label}
                  </button>

                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto rounded-2xl border bg-background dark:border-slate-800">
          {filteredBudgets.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              {budgets.length === 0
                ? t('empty.title')
                : t('empty.noResults')}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left w-[25%]">{t('labels.category')}</th>
                  <th className="px-4 py-3 text-left w-[30%]">{t('labels.limitAndUsage')}</th>
                  <th className="px-4 py-3 text-left w-[20%]">{t('labels.period')}</th>
                  <th className="px-4 py-3 text-left w-[15%]">{t('labels.status')}</th>
                  <th className="px-4 py-3 text-right w-[10%]">{t('labels.action')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredBudgets.map((b) => {
                  const st = normalizeStatus(b);
                  const timeStatus = getTimeStatus(b.start_date, b.end_date);

                  const progressInfo = budgetProgress[String(b.id)];
                  const rawPercent = progressInfo?.percent ?? 0;
                  const cappedPercent = Math.max(
                    0,
                    Math.min(rawPercent, 100)
                  );
                  const displayPercent =
                    rawPercent > 100 ? '100%+' : `${cappedPercent}%`;

                  // Màu thanh progress với sự khác biệt rõ ràng giữa 80% và 100%
                  let barColorClass =
                    'from-emerald-500 to-emerald-600'; // < 50%
                  if (cappedPercent >= 100 || rawPercent > 100) {
                    barColorClass = 'from-red-700 to-red-800'; // Đỏ đậm cho 100%+
                  } else if (cappedPercent >= 80) {
                    barColorClass = 'from-orange-500 to-orange-600'; // Cam cho 80-99%
                  } else if (cappedPercent >= 50) {
                    barColorClass = 'from-amber-500 to-amber-600'; // Vàng cho 50-79%
                  }

                  const spentLabel =
                    progressInfo && b.limit_amount
                      ? `${formatCurrency(
                          progressInfo.totalSpent
                        )} / ${formatCurrency(b.limit_amount)} (${displayPercent})`
                      : t('labels.noTransactionsInPeriod');

                  const statusClass =
                    st === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : st === 'EXPIRED'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200';

                  // Hiển thị thời gian theo trạng thái
                  let daysLabel = '';
                  let daysLabelClass = '';
                  if (timeStatus.status === 'NOT_STARTED') {
                    // Safety check: nếu còn 0 ngày thì coi như đã bắt đầu
                    if (timeStatus.daysUntilStart <= 0) {
                      // Xử lý như đang hoạt động
                      const daysLeft = calcDaysLeft(b.end_date);
                      if (daysLeft === null) {
                        daysLabel = t('labels.unlimited');
                        daysLabelClass = 'bg-blue-50 text-blue-700';
                      } else if (daysLeft > 0) {
                        daysLabel = t('labels.daysLeft', { days: daysLeft });
                        daysLabelClass = 'bg-blue-50 text-blue-700';
                      } else if (daysLeft === 0) {
                        daysLabel = t('labels.lastDay');
                        daysLabelClass = 'bg-amber-50 text-amber-700';
                      } else {
                        daysLabel = t('labels.overdue');
                        daysLabelClass = 'bg-red-50 text-red-700';
                      }
                    } else {
                      daysLabel = t('labels.daysUntilStart', { days: timeStatus.daysUntilStart });
                      daysLabelClass = 'bg-gray-50 text-gray-700';
                    }
                  } else if (timeStatus.status === 'EXPIRED') {
                    daysLabel = t('labels.daysOverdue', { days: timeStatus.daysOverdue });
                    daysLabelClass = 'bg-red-50 text-red-700';
                  } else {
                    // timeStatus.status === 'ACTIVE'
                    const daysLeft = 'daysLeft' in timeStatus ? (timeStatus.daysLeft ?? null) : null;
                    if (daysLeft === null) {
                      daysLabel = t('labels.unlimited');
                      daysLabelClass = 'bg-blue-50 text-blue-700';
                    } else if (daysLeft !== undefined && daysLeft > 0) {
                      daysLabel = t('labels.daysLeft', { days: daysLeft });
                      daysLabelClass = 'bg-blue-50 text-blue-700';
                    } else if (daysLeft !== undefined && daysLeft === 0) {
                      daysLabel = t('labels.lastDay');
                      daysLabelClass = 'bg-amber-50 text-amber-700';
                    } else {
                      daysLabel = t('labels.overdue');
                      daysLabelClass = 'bg-red-50 text-red-700';
                    }
                  }

                  return (
                    <tr
                      key={b.id}
                      className="border-b last:border-0 hover:bg-muted/40 transition-colors"
                    >
                      <td className="px-4 py-3 align-middle">
                        <span className="font-semibold text-foreground">
                          {getCategoryName(b)}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <div className="space-y-2">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="text-sm font-bold text-foreground">
                              {formatCurrency(b.limit_amount ?? 0)}
                            </span>
                            <span className="text-xs font-medium text-muted-foreground">
                              {displayPercent}
                            </span>
                          </div>
                          {/* Progress bar */}
                          <div
                            className="h-2 w-full overflow-hidden rounded-full bg-muted/50 border border-muted"
                            title={spentLabel}
                          >
                            <div
                              className={`h-full rounded-full bg-gradient-to-r ${barColorClass} transition-all duration-500`}
                              style={{ width: `${cappedPercent}%` }}
                            />
                          </div>
                          {/* Hiển thị số tiền đã chi / hạn mức */}
                          {progressInfo && b.limit_amount ? (
                            <p className="text-xs text-muted-foreground">
                              <span className="font-medium">
                                {formatCurrency(progressInfo.totalSpent)}
                              </span>
                              {' / '}
                              <span>{formatCurrency(b.limit_amount)}</span>
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground italic">
                              {t('labels.noTransactions')}
                            </p>
                          )}
                          {b.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1 italic">
                              {b.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-sm text-foreground">
                            <span className="text-muted-foreground text-xs min-w-[3rem]">{t('labels.from')}</span>
                            <span className="font-medium">{formatDate(b.start_date)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-foreground">
                            <span className="text-muted-foreground text-xs min-w-[3rem]">{t('labels.to')}</span>
                            <span className="font-medium">{formatDate(b.end_date)}</span>
                          </div>
                          <div className="mt-1 flex items-center gap-1.5 text-xs">
                            <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-medium ${daysLabelClass}`}>
                              {timeStatus.status === 'NOT_STARTED' && <span>📅</span>}
                              {timeStatus.status === 'EXPIRED' && <span>⚠️</span>}
                              {timeStatus.status === 'ACTIVE' && <span>⏱️</span>}
                              {daysLabel}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold shadow-sm ${statusClass}`}
                        >
                          {st === 'ACTIVE' ? (
                            <>
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span>{t('status.active')}</span>
                            </>
                          ) : st === 'EXPIRED' ? (
                            <>
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                              <span>{t('status.expired')}</span>
                            </>
                          ) : (
                            <>
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                              <span>{t('status.cancelled')}</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-middle text-right">
                        <div className="flex justify-end gap-2">
                          {st === 'ACTIVE' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleEditBudget(b)}
                                className="group inline-flex h-8 w-8 items-center justify-center rounded-lg border border-muted bg-background text-muted-foreground transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                                title={t('actions.edit')}
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleCancelBudget(b)}
                                className="group inline-flex h-8 w-8 items-center justify-center rounded-lg border border-muted bg-background text-muted-foreground transition-all hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600"
                                title={t('actions.cancel')}
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                              </button>
                            </>
                          )}
                          {st === 'CANCELLED' && (
                            <button
                              type="button"
                              onClick={() => void handleDeleteBudget(b)}
                              className="group inline-flex h-8 w-8 items-center justify-center rounded-lg border border-muted bg-background text-muted-foreground transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                              title={t('actions.delete')}
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                          {st === 'EXPIRED' && (
                            <button
                              type="button"
                              onClick={() => handleEditBudget(b)}
                              className="group inline-flex h-8 w-8 items-center justify-center rounded-lg border border-muted bg-background text-muted-foreground transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                              title={t('actions.extend')}
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <BudgetModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        editingBudget={editingBudget}
        categories={expenseCategories}
      />
    </section>
  );
}
