// context/BudgetContext.tsx
import React, {
  createContext,
  useState,
  useContext,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import api from '../services/api';
import type { Budget } from '../types/index';
import { useNotificationsContext } from './NotificationContext'; // Sử dụng đúng hook
import { useCategoryContext } from './CategoryContext';
import { AuthContext } from './AuthContext';
import i18n from '../language/i18next/config';
import { sendNotification, hasSentNotification, markNotificationAsSent, clearNotificationSent } from '../services/notificationService';

// Helper function để format currency
const formatCurrency = (amount: number): string => {
  return amount.toLocaleString();
};

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
  const authContext = useContext(AuthContext);
  const user = authContext?.user ?? null;
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
  
  // Ref để track user đã load budgets chưa
  const loadedUserIdRef = useRef<number | string | null>(null);

  // ======== TỰ ĐỘNG LOAD BUDGETS KHI CÓ USER ========
  
  // Tự động load budgets khi user đăng nhập hoặc thay đổi
  useEffect(() => {
    if (!user?.id) {
      // Nếu không có user, reset ref và clear budgets
      if (loadedUserIdRef.current !== null) {
        console.log('[BudgetContext] No user, clearing budgets and resetting ref');
        loadedUserIdRef.current = null;
        setBudgets([]);
      }
      return;
    }

    const userId = user.id;
    // Chỉ load nếu chưa load cho user này và không đang loading
    if (loadedUserIdRef.current !== userId && !loading) {
      console.log(`[BudgetContext] Auto-loading budgets for user ${userId}`);
      loadedUserIdRef.current = userId;
      getBudgets(userId).catch((err) => {
        console.error('[BudgetContext] Error loading budgets:', err);
        loadedUserIdRef.current = null; // Reset nếu lỗi
      });
    } else if (loadedUserIdRef.current === userId) {
      console.log(`[BudgetContext] Budgets already loaded for user ${userId}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Chỉ phụ thuộc vào user.id để tránh loop

  // ======== CRUD BUDGET ========

  // Lấy budgets theo user
  const getBudgets = useCallback(async (userId: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/budgets?user_id=${userId}`);
      setBudgets(response.data);
      loadedUserIdRef.current = userId; // Đánh dấu đã load cho user này
      console.log(`[BudgetContext] Loaded ${response.data.length} budgets for user ${userId}`);
    } catch (error) {
      setError(i18n.t('errors.fetchError', { ns: 'budget' }));
      console.error('[BudgetContext] Error loading budgets:', error);
      loadedUserIdRef.current = null; // Reset nếu lỗi
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
            // Xóa các notification keys cũ cho budget này (nếu có)
            [50, 80, 100].forEach(level => {
              clearNotificationSent(created.user_id, 'WARNING', `budget-${created.id}-${level}`);
            });
          }
          return next;
        });
      } catch (error) {
        setError(i18n.t('errors.createError', { ns: 'budget' }));
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
            // Xóa các notification keys cũ cho budget này để có thể gửi lại thông báo
            [50, 80, 100].forEach(level => {
              clearNotificationSent(updatedBudget.user_id, 'WARNING', `budget-${updatedBudget.id}-${level}`);
            });
            console.log(`[Budget ${updatedBudget.id}] Reset notification levels and cleared old notification keys`);
          }
          return next;
        });
      } catch (error) {
        setError(i18n.t('errors.updateError', { ns: 'budget' }));
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
        setError(i18n.t('errors.deleteError', { ns: 'budget' }));
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

        // Normalize dates để so sánh chính xác (set về 00:00:00)
        const start = new Date(budget.start_date);
        start.setHours(0, 0, 0, 0);
        
        const endDateStr = budget.end_date || new Date().toISOString().slice(0, 10);
        const end = new Date(endDateStr);
        end.setHours(23, 59, 59, 999); // Set về cuối ngày để bao gồm cả ngày kết thúc

        console.log(`[Budget ${budget.id}] Checking transactions from ${start.toISOString()} to ${end.toISOString()}`);

        const txsInRange = (response.data as any[]).filter((tx) => {
          if (!tx.date) return false;
          const txDate = new Date(tx.date);
          txDate.setHours(0, 0, 0, 0);
          if (Number.isNaN(txDate.getTime())) return false;
          const inRange = txDate >= start && txDate <= end;
          return inRange;
        });

        const totalSpent = txsInRange.reduce(
          (sum, tx) => sum + (Number(tx.amount) || 0),
          0
        );

        console.log(`[Budget ${budget.id}] Found ${txsInRange.length} transactions, total spent: ${totalSpent}, limit: ${budget.limit_amount}`);

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
        console.log(`[Budget ${budget.id}] Progress: ${progress.toFixed(2)}%, Level: ${level}%`);
        
        if (level === 0) {
          console.log(`[Budget ${budget.id}] Level is 0, skipping notification`);
          return;
        }

        const key = String(budget.id);
        const lastLevel = notifiedLevels[key] ?? 0;
        console.log(`[Budget ${budget.id}] Last notified level: ${lastLevel}%, Current level: ${level}%, Progress: ${progress.toFixed(2)}%`);

        // Tạo notification key để check duplicate
        const notificationKey = `budget-${budget.id}-${level}`;
        
        // Kiểm tra xem đã gửi thông báo cho level này chưa (check localStorage)
        const hasSentInStorage = hasSentNotification(budget.user_id, 'WARNING', notificationKey);
        
        console.log(`[Budget ${budget.id}] Checking duplicate prevention:`);
        console.log(`  - Last notified level: ${lastLevel}%`);
        console.log(`  - Current level: ${level}%`);
        console.log(`  - Has sent in storage: ${hasSentInStorage}`);
        console.log(`  - Notification key: ${notificationKey}`);
        
        // Nếu đã gửi ở level này hoặc level cao hơn VÀ đã xác nhận trong storage → không gửi lại
        if (lastLevel >= level && hasSentInStorage) {
          console.log(`[Budget ${budget.id}] ✅ Already notified at level ${lastLevel}% (>= ${level}%) and confirmed in storage, skipping`);
          return;
        }
        
        // Nếu notifiedLevels nói đã gửi nhưng không có trong storage (inconsistency)
        // Có thể là bug hoặc data bị mất, trong trường hợp này vẫn gửi lại để đảm bảo
        if (lastLevel >= level && !hasSentInStorage) {
          console.log(`[Budget ${budget.id}] ⚠️ notifiedLevels says ${lastLevel}% but no notification in storage - possible data loss, will send notification`);
          // Không sync, mà sẽ gửi lại thông báo để đảm bảo user nhận được
          // Reset notifiedLevels để cho phép gửi lại
          setNotifiedLevels((prev) => {
            const next = { ...prev };
            delete next[key];
            if (typeof window !== 'undefined') {
              window.localStorage.setItem(
                'budgetNotifiedLevels',
                JSON.stringify(next)
              );
            }
            return next;
          });
          // Tiếp tục để gửi thông báo
        }

        // Kiểm tra settings - xem budget alerts có được bật không
        try {
          const saved = localStorage.getItem('app-settings');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.notifications && parsed.notifications.budgetAlerts === false) {
              // Budget alerts đã bị tắt, không gửi thông báo
              console.log(`[Budget ${budget.id}] Budget alerts are disabled in settings, skipping`);
              return;
            }
          }
        } catch (error) {
          console.error('[Budget] Error reading notification settings:', error);
          // Nếu có lỗi, vẫn gửi thông báo (default behavior)
        }
        
        console.log(`[Budget ${budget.id}] Proceeding to send notification for level ${level}%`);

        // Tìm tên danh mục để hiển thị đẹp trong thông báo
        const category = categories.find(
          (c) => String(c.id) === String(budget.category_id)
        );
        const categoryName = category?.name ?? i18n.t('errors.categoryFallback', { 
          ns: 'budget', 
          id: budget.category_id 
        });

        // Gửi thông báo theo level (tùy chỉnh theo nghiệp vụ)
        let message = '';
        if (level === 50) {
          message = i18n.t('messages.budgetWarning.message50', { 
            ns: 'notifications',
            categoryName 
          });
        } else if (level === 80) {
          message = i18n.t('messages.budgetWarning.message80', { 
            ns: 'notifications',
            categoryName 
          });
        } else if (level === 100) {
          message = i18n.t('messages.budgetWarning.message100', { 
            ns: 'notifications',
            categoryName 
          });
        }
        
        // Kiểm tra message có rỗng không
        if (!message || message.trim() === '') {
          console.error(`[Budget ${budget.id}] Message is empty for level ${level}%`);
          console.error(`[Budget ${budget.id}] Category name: ${categoryName}`);
          // Fallback message nếu không tìm thấy translation
          message = `Ngân sách ${categoryName} đã đạt ${level}% (${formatCurrency(totalSpent)} / ${formatCurrency(budget.limit_amount)})`;
        }
        
        console.log(`[Budget ${budget.id}] Prepared message for level ${level}%: ${message}`);

        // Gửi notification sử dụng notificationService
        // Key đã được định nghĩa ở trên: budget-{budgetId}-{level}
        // Kiểm tra lại một lần nữa để tránh race condition (nếu nhiều lần gọi cùng lúc)
        const alreadySent = hasSentNotification(budget.user_id, 'WARNING', notificationKey);
        console.log(`[Budget ${budget.id}] Final check - Has sent notification: ${alreadySent} for key: ${notificationKey}`);
        
        if (alreadySent) {
          console.log(`⏭️ [Budget ${budget.id}] Budget notification already sent for level ${level}%, skipping...`);
          // Vẫn cập nhật notifiedLevels để đảm bảo sync với localStorage
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
          return;
        }
        
        // Nếu chưa gửi, tiến hành gửi thông báo
        try {
          console.log(`[Budget ${budget.id}] 🚀 Sending notification for level ${level}%...`);
          console.log(`[Budget ${budget.id}] User ID: ${budget.user_id}`);
          console.log(`[Budget ${budget.id}] Title: ${i18n.t('messages.budgetWarning.title', { ns: 'notifications' })}`);
          console.log(`[Budget ${budget.id}] Message: ${message}`);
          
          await sendNotification(
            budget.user_id,
            'WARNING',
            i18n.t('messages.budgetWarning.title', { ns: 'notifications' }),
            message
          );
          console.log(`✅ [Budget ${budget.id}] Budget notification sent successfully at ${level}%`);

          // Đánh dấu đã gửi NGAY SAU KHI gửi thành công
          markNotificationAsSent(budget.user_id, 'WARNING', notificationKey);
          console.log(`[Budget ${budget.id}] ✅ Marked notification as sent in localStorage`);

          // Cập nhật notifiedLevels sau khi gửi thành công
          setNotifiedLevels((prev) => {
            const next = { ...prev, [key]: level };
            if (typeof window !== 'undefined') {
              window.localStorage.setItem(
                'budgetNotifiedLevels',
                JSON.stringify(next)
              );
            }
            console.log(`[Budget ${budget.id}] ✅ Updated notifiedLevels to ${level}%`);
            return next;
          });

          // Refresh notifications để hiển thị ngay
          // Đợi một chút để đảm bảo API đã xử lý xong
          await new Promise(resolve => setTimeout(resolve, 500));
          console.log(`[Budget ${budget.id}] 🔄 Refreshing notification list...`);
          await refresh();
          console.log(`[Budget ${budget.id}] ✅ Notification list refreshed`);
        } catch (notifyErr) {
          console.error(`❌ [Budget ${budget.id}] Error sending budget notification:`, notifyErr);
          console.error(`❌ [Budget ${budget.id}] Error details:`, {
            userId: budget.user_id,
            level,
            notificationKey,
            error: notifyErr
          });
          // Nếu lỗi khi gửi, không cập nhật notifiedLevels để có thể thử lại lần sau
          return;
        }
      } catch (error) {
        console.error(i18n.t('errors.checkProgressError', { ns: 'budget' }), error);
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
    if (!budgets.length) {
      console.log('[BudgetContext] No budgets, skipping check');
      return;
    }

    console.log(`[BudgetContext] Checking ${budgets.length} budgets...`);

    // Chạy kiểm tra ngay lập tức khi danh sách ngân sách thay đổi
    budgets.forEach((budget) => {
      if (budget.status === 'ACTIVE') {
        console.log(`[BudgetContext] Checking active budget ${budget.id}`);
        void checkProgress(budget);
      } else {
        console.log(`[BudgetContext] Skipping budget ${budget.id} with status: ${budget.status}`);
      }
    });

    const intervalId = window.setInterval(() => {
      console.log(`[BudgetContext] Periodic check triggered for ${budgets.length} budgets`);
      budgets.forEach((budget) => {
        if (budget.status === 'ACTIVE') {
          // Kiểm tra tiến độ cho từng budget đang hoạt động
          console.log(`[BudgetContext] Periodic check for budget ${budget.id}`);
          void checkProgress(budget);
        }
      });
    }, 30000); // 30s để tránh gọi API quá thường xuyên, tối ưu hiệu suất

    // Cleanup: clear interval khi budgets thay đổi hoặc unmount
    return () => {
      console.log('[BudgetContext] Cleaning up interval');
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
    throw new Error(i18n.t('errors.contextError', { ns: 'budget' }));
  }
  return context;
};
