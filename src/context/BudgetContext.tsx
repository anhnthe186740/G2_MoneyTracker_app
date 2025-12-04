// context/BudgetContext.tsx
import React, {
  createContext,
  useState,
  useContext,
  useCallback,
  useEffect,
} from 'react';
import api from '../services/api';
import type { Budget } from '../types/index';
import { useNotificationsContext } from './NotificationContext'; // Sử dụng đúng hook
import { useCategoryContext } from './CategoryContext';

// Kiểu dữ liệu cho context (tránh dùng any)
interface BudgetContextType {
  budgets: Budget[];
  loading: boolean;
  error: string | null;
  getBudgets: (userId: number) => Promise<void>;
  createBudget: (
    newBudget: Omit<Budget, 'id' | 'created_at'>
  ) => Promise<void>;
  updateBudget: (
    budgetId: number | string,
    updatedData: Partial<Budget>
  ) => Promise<void>;
  deleteBudget: (budgetId: number | string) => Promise<void>;
  // Tiến độ sử dụng ngân sách theo id (percent & tổng tiền đã chi)
  budgetProgress: Record<
    string,
    {
      percent: number;
      totalSpent: number;
    }
  >;
  // Cho phép các màn hình khác (Transactions, Recurring...) trigger kiểm tra tiến độ ngay lập tức
  recheckBudgetsProgress: () => void;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

export const BudgetProvider = ({ children }: { children: React.ReactNode }) => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { refresh } = useNotificationsContext(); // Lấy các hàm từ NotificationContext
  const [notifiedLevels, setNotifiedLevels] = useState<
    Record<string, 0 | 50 | 80 | 100>
  >(() => {
    if (typeof window === 'undefined') return {};
    try {
      const raw = window.localStorage.getItem('budgetNotifiedLevels');
      if (!raw) return {};
      const parsed = JSON.parse(raw) as Record<string, 0 | 50 | 80 | 100>;
      return parsed ?? {};
    } catch {
      return {};
    }
  });
  const [budgetProgress, setBudgetProgress] = useState<
    Record<
      string,
      {
        percent: number;
        totalSpent: number;
      }
    >
  >({});
  const { categories } = useCategoryContext();

  // ======== CRUD BUDGET ========

  // Lấy budgets theo user
  const getBudgets = useCallback(async (userId: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/budgets?user_id=${userId}`);
      setBudgets(response.data);
    } catch (error) {
      setError('Lỗi khi lấy ngân sách.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Tạo budget mới
  const createBudget = useCallback(
    async (newBudget: Omit<Budget, 'id' | 'created_at'>) => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.post('/budgets', newBudget);
        const created: Budget = response.data;
        setBudgets((prev) => [...prev, created]);

        // Reset trạng thái thông báo cho budget mới
        setNotifiedLevels((prev) => {
          const next = {
            ...prev,
            [String(created.id)]: 0 as 0,
          };
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(
              'budgetNotifiedLevels',
              JSON.stringify(next)
            );
          }
          return next;
        });
      } catch (error) {
        setError('Lỗi khi tạo ngân sách.');
        console.error(error);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Cập nhật budget
  const updateBudget = useCallback(
    async (budgetId: number | string, updatedData: Partial<Budget>) => {
      setLoading(true);
      setError(null);
      try {
        // Dùng PATCH để tránh ghi đè toàn bộ object budget trong json-server
        const response = await api.patch(`/budgets/${budgetId}`, updatedData);
        const updatedBudget: Budget = response.data;

        setBudgets((prev) =>
          prev.map((budget) =>
            budget.id === updatedBudget.id ? updatedBudget : budget
          )
        );

        // Khi cập nhật hạn mức / thời gian, reset level để tính lại thông báo
        setNotifiedLevels((prev) => {
          const next = {
            ...prev,
            [String(updatedBudget.id)]: 0 as 0,
          };
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(
              'budgetNotifiedLevels',
              JSON.stringify(next)
            );
          }
          return next;
        });
      } catch (error) {
        setError('Lỗi khi cập nhật ngân sách.');
        console.error(error);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Xóa budget
  const deleteBudget = useCallback(
    async (budgetId: number | string) => {
      setLoading(true);
      setError(null);
      try {
        await api.delete(`/budgets/${budgetId}`);
        setBudgets((prev) => prev.filter((budget) => budget.id !== budgetId));

        // Xóa luôn trạng thái thông báo đã gửi cho budget đó
        setNotifiedLevels((prev) => {
          const copy = { ...prev };
          delete copy[String(budgetId)];
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(
              'budgetNotifiedLevels',
              JSON.stringify(copy)
            );
          }
          return copy;
        });
      } catch (error) {
        setError('Lỗi khi xóa ngân sách.');
        console.error(error);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // ======== LOGIC CHECK TIẾN ĐỘ & THÔNG BÁO ========

  // Kiểm tra % sử dụng và bắn notification
  const checkProgress = useCallback(
    async (budget: Budget) => {
      try {
        if (!budget.limit_amount || budget.limit_amount <= 0) {
          // Nếu không có hạn mức hợp lệ thì coi như 0%
        setBudgetProgress((prev) => ({
          ...prev,
          [String(budget.id)]: { percent: 0, totalSpent: 0 },
        }));
          return;
        }

        // Lấy tất cả giao dịch chi tiêu theo user + category, rồi lọc theo khoảng thời gian ở FE
        const response = await api.get(
          `/transactions?user_id=${budget.user_id}&category_id=${budget.category_id}&type=EXPENSE`
        );

        const start = new Date(budget.start_date);
        const end = new Date(
          budget.end_date || new Date().toISOString().slice(0, 10)
        );

        const txsInRange = (response.data as any[]).filter((tx) => {
          if (!tx.date) return false;
          const d = new Date(tx.date);
          if (Number.isNaN(d.getTime())) return false;
          return d >= start && d <= end;
        });

        const totalSpent = txsInRange.reduce(
          (sum, tx) => sum + (Number(tx.amount) || 0),
          0
        );

        const progress = (totalSpent / budget.limit_amount) * 100;

        // Lưu tiến độ cho UI hiển thị ( clamp 0–100+ )
        setBudgetProgress((prev) => ({
          ...prev,
          [String(budget.id)]: {
            percent: Math.max(0, Math.round(progress)),
            totalSpent,
          },
        }));

        const getLevel = (p: number): 0 | 50 | 80 | 100 => {
          if (p >= 100) return 100;
          if (p >= 80) return 80;
          if (p >= 50) return 50;
          return 0;
        };

        const level = getLevel(progress);
        if (level === 0) return;

        const key = String(budget.id);
        const lastLevel = notifiedLevels[key] ?? 0;

        // Đã gửi cảnh báo level này rồi hoặc cao hơn → không gửi lại
        if (lastLevel >= level) return;

        // Tìm tên danh mục để hiển thị đẹp trong thông báo
        const category = categories.find(
          (c) => String(c.id) === String(budget.category_id)
        );
        const categoryName = category?.name ?? `Danh mục ${budget.category_id}`;

        // Gửi thông báo theo level (tùy chỉnh theo nghiệp vụ)
        let message = '';
        if (level === 50) {
          message = `Ngân sách cho danh mục "${categoryName}" đã đạt 50% hạn mức.`;
        } else if (level === 80) {
          message = `Ngân sách cho danh mục "${categoryName}" đã đạt 80% hạn mức.`;
        } else if (level === 100) {
          message = `Ngân sách cho danh mục "${categoryName}" đã vượt 100% hạn mức.`;
        }

        // Gửi notification sang json-server
        await api.post('/notifications', {
          user_id: budget.user_id,
          type: 'WARNING', // phù hợp với type đã khai báo trong model Notification
          title: 'Cảnh báo ngân sách',
          message,
          is_read: false,
          created_at: new Date().toISOString(),
        });
        console.log(message);

        // Refresh notifications
        refresh();

        setNotifiedLevels((prev) => {
          const next = { ...prev, [key]: level };
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(
              'budgetNotifiedLevels',
              JSON.stringify(next)
            );
          }
          return next;
        });
      } catch (error) {
        console.error('Lỗi khi kiểm tra tiến độ ngân sách:', error);
      }
    },
    [notifiedLevels, refresh, categories]
  );

  // Cho phép trigger kiểm tra tiến độ ngay lập tức (dùng cho Transactions, Recurring...)
  const recheckBudgetsProgress = useCallback(() => {
    if (!budgets.length) return;
    budgets.forEach((budget) => {
      if (budget.status === 'ACTIVE') {
        void checkProgress(budget);
      }
    });
  }, [budgets, checkProgress]);

  // ======== SHORT POLLING THEO THỜI GIAN THỰC ========

  useEffect(() => {
    if (!budgets.length) return;

    // Chạy kiểm tra ngay lập tức khi danh sách ngân sách thay đổi
    budgets.forEach((budget) => {
      if (budget.status === 'ACTIVE') {
        void checkProgress(budget);
      }
    });

    const intervalId = window.setInterval(() => {
      budgets.forEach((budget) => {
        if (budget.status === 'ACTIVE') {
          // Kiểm tra tiến độ cho từng budget đang hoạt động
          void checkProgress(budget);
        }
      });
    }, 30000); // 30s để tránh gọi API quá thường xuyên, tối ưu hiệu suất

    // Cleanup: clear interval khi budgets thay đổi hoặc unmount
    return () => {
      window.clearInterval(intervalId);
    };
  }, [budgets, checkProgress]);

  return (
    <BudgetContext.Provider
      value={{
        budgets,
        loading,
        error,
        getBudgets,
        createBudget,
        updateBudget,
        deleteBudget,
        budgetProgress,
        recheckBudgetsProgress,
      }}
    >
      {children}
    </BudgetContext.Provider>
  );
};

// Hook dùng trong component
export const useBudgetContext = () => {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error('useBudgetContext phải được dùng bên trong BudgetProvider');
  }
  return context;
};
