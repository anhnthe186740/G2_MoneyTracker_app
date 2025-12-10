import { Button } from "../components/ui/Button";
import { useEffect, useState, useContext } from "react";
import { useTranslation } from "react-i18next";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import GoalCard from "../components/goals/GoalCard";
import GoalsSummary from "../components/goals/GoalsSummary";
import GoalModal from "../components/goals/GoalModal";
import AddMoneyModal from "../components/goals/AddMoneyModal";
import FavoriteGoals from "../components/goals/FavoriteGoals";
import { checkGoalProgress, checkGoalCompletion, sendGoalDeadlineReminder } from "../services/notificationService";

type Goal = {
  id: string;
  user_id: string | number;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string;
  status: string;
  wallet_id: number;
};

type Wallet = {
  id: number;
  user_id: number;
  name: string;
  balance: number;
};

export default function Goals() {
  const { t } = useTranslation("goals");
  const auth = useContext(AuthContext) as any;
  const user = auth?.user;

  const [goals, setGoals] = useState<Goal[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [favoriteGoalIds, setFavoriteGoalIds] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('favoriteGoalIds');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const [open, setOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState<string>("");
  const [targetAmount, setTargetAmount] = useState<string>("");
  const [selectedWallet, setSelectedWallet] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("inProgress");
  const [dueDate, setDueDate] = useState<string>("");
  const [initialAmount, setInitialAmount] = useState<string>("");
  const [sourceWallet, setSourceWallet] = useState<string>("");

  const [addMoneyOpen, setAddMoneyOpen] = useState<boolean>(false);
  const [addMoneyGoalId, setAddMoneyGoalId] = useState<string>("");
  const [addMoneyAmount, setAddMoneyAmount] = useState<string>("");
  const [addMoneyFromWallet, setAddMoneyFromWallet] = useState<string>("");

  const getWallet = (walletId: number) =>
    wallets.find((w) => Number(w.id) === Number(walletId));
    
  const calcProgress = (goalId: string) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return { current: 0, percent: 0, completed: false };
    const current = goal.current_amount || 0;
    const percent =
      goal.target_amount === 0
        ? 0
        : Math.round((current / goal.target_amount) * 100);
    return { current, percent, completed: percent >= 100 };
  };
  
  const format = (v: number) => v.toLocaleString();

  const resetForm = () => {
    setTitle("");
    setTargetAmount("");
    setSelectedWallet("");
    setSelectedStatus("inProgress");
    setDueDate("");
    setInitialAmount("");
    setSourceWallet("");
    setError(null);
  };

  const toggleFavorite = (goalId: string) => {
    setFavoriteGoalIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(goalId)) {
        newSet.delete(goalId);
      } else {
        newSet.add(goalId);
      }
      localStorage.setItem('favoriteGoalIds', JSON.stringify([...newSet]));
      return newSet;
    });
  };

  useEffect(() => {
    localStorage.setItem('favoriteGoalIds', JSON.stringify([...favoriteGoalIds]));
  }, [favoriteGoalIds]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [goalsRes, walletsRes] = await Promise.all([
          api.get<Goal[]>("/goals"),
          api.get<Wallet[]>("/wallets"),
        ]);

        if (user?.id) {
          const filteredGoals = goalsRes.data.filter(
            (g) => String(g.user_id) === String(user.id)
          );
          const filteredWallets = walletsRes.data.filter(
            (w) => String(w.user_id) === String(user.id)
          );
          setGoals(filteredGoals);
          setWallets(filteredWallets);

          // Kiểm tra deadline reminders cho tất cả mục tiêu
          try {
            for (const goal of filteredGoals) {
              if (goal.deadline && goal.status !== 'completed') {
                await sendGoalDeadlineReminder(user.id, {
                  id: goal.id,
                  name: goal.name,
                  deadline: goal.deadline,
                  current_amount: goal.current_amount || 0,
                  target_amount: goal.target_amount,
                });
              }
            }
          } catch (notifyErr) {
            console.error('Error checking goal deadlines:', notifyErr);
          }
        } else {
          setGoals(Array.isArray(goalsRes.data) ? goalsRes.data : []);
          setWallets(Array.isArray(walletsRes.data) ? walletsRes.data : []);
        }
      } catch (e) {
        setError(t("loadError"));
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const name = title.trim();
    const target = Number(targetAmount);

    if (!name) {
      setError(t("validation.nameRequired"));
      return;
    }
    if (isNaN(target) || target <= 0) {
      setError(t("validation.amountPositive"));
      return;
    }

    const initAmount = Number(initialAmount) || 0;

    if (!editingId && (initialAmount === "" || initAmount <= 0)) {
      setError(t("validation.currentAmountRequired"));
      return;
    }

    if (!editingId && initAmount > 0) {
      const srcWalletId = Number(sourceWallet);

      if (isNaN(srcWalletId) || srcWalletId <= 0) {
        setError(t("validation.selectSourceWallet"));
        return;
      }

      const fromWallet = wallets.find((w) => Number(w.id) === srcWalletId);
      if (!fromWallet) {
        setError(t("validation.walletNotFound"));
        return;
      }

      if (fromWallet.balance < initAmount) {
        setError(
          t("validation.insufficientBalance", {
            wallet: fromWallet.name,
            balance: format(fromWallet.balance),
          })
        );
        return;
      }
    }

    try {
      const walletId = editingId
        ? selectedWallet
        : initAmount > 0
        ? sourceWallet
        : null;
      const payload: any = {
        name,
        target_amount: target,
        wallet_id: walletId || null,
        deadline: dueDate,
        status: selectedStatus,
      };
      if (!editingId) {
        payload.current_amount = initAmount > 0 ? initAmount : 0;
      } else {
        // When editing, preserve the current_amount
        const existingGoal = goals.find((g) => g.id === editingId);
        if (existingGoal) {
          payload.current_amount = existingGoal.current_amount || 0;
        }
      }
      if (user?.id) {
        const numId = Number(user.id);
        payload.user_id =
          !isNaN(numId) && String(numId) === user.id ? numId : user.id;
      }

      if (editingId) {
        const { data } = await api.put<Goal>(`/goals/${editingId}`, payload);
        setGoals((prev) =>
          prev.map((g) => (g.id === editingId ? { ...g, ...data } : g))
        );
      } else {
        const newGoal = {
          ...payload,
          id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };

        let createdGoalId: string | null = null;
        try {
          const { data } = await api.post<Goal>("/goals", newGoal);
          createdGoalId = data.id;
          setGoals((prev) => [...prev, data]);

          if (initAmount > 0 && walletId) {
            const wallet = wallets.find(
              (w) => String(w.id) === String(walletId)
            );
            if (wallet) {
              await api.patch(`/wallets/${wallet.id}`, {
                balance: wallet.balance - initAmount,
              });

              const { data: walletsData } = await api.get<Wallet[]>("/wallets");
              const filteredWallets = walletsData.filter(
                (w: Wallet) => String(w.user_id) === String(user.id)
              );
              setWallets(filteredWallets);
            }
          }
        } catch (walletErr) {
          if (createdGoalId) {
            await api.delete(`/goals/${createdGoalId}`);
            setGoals((prev) => prev.filter((g) => g.id !== createdGoalId));
          }
          throw walletErr;
        }
      }
      setOpen(false);
      resetForm();
      setEditingId(null);
    } catch (err) {
      setError(t("toast.saveError"));
    }
  };

  const handleEdit = (goal: Goal) => {
    setEditingId(goal.id);
    setTitle(goal.name);
    setTargetAmount(String(goal.target_amount));
    setSelectedWallet(String(goal.wallet_id));
    setSelectedStatus(goal.status);
    setDueDate(goal.deadline || "");
    setOpen(true);
  };

  const handleDelete = async (goal: Goal) => {
    if (!window.confirm(t("confirm.delete", { name: goal.name }))) {
      return;
    }

    try {
      if (goal.current_amount && goal.current_amount > 0 && goal.wallet_id) {
        const wallet = wallets.find((w) => String(w.id) === String(goal.wallet_id));
        if (wallet) {
          await api.patch(`/wallets/${wallet.id}`, {
            balance: wallet.balance + goal.current_amount,
          });

          const { data: walletsData } = await api.get<Wallet[]>("/wallets");
          const filteredWallets = walletsData.filter(
            (w: Wallet) => String(w.user_id) === String(user.id)
          );
          setWallets(filteredWallets);
        }
      }

      await api.delete(`/goals/${goal.id}`);
      setGoals((p) => p.filter((x) => x.id !== goal.id));
      setFavoriteGoalIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(goal.id);
        return newSet;
      });
    } catch {
      alert(t("toast.deleteError"));
    }
  };

  const handleAddMoneySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(addMoneyAmount);
    const fromWalletId = addMoneyFromWallet;

    if (isNaN(amount) || amount <= 0) {
      alert(t("validation.amountMustBePositive"));
      return;
    }

    if (!fromWalletId) {
      alert(t("validation.selectWallet"));
      return;
    }

    const goal = goals.find((g) => g.id === addMoneyGoalId);
    const fromWallet = wallets.find((w) => String(w.id) === String(fromWalletId));

    if (!fromWallet) {
      alert(t("validation.walletNotFoundGeneral"));
      return;
    }

    if (fromWallet.balance < amount) {
      alert(t("validation.insufficientSourceBalance"));
      return;
    }

    if (!goal) {
      alert(t("validation.goalNotFound"));
      return;
    }

    try {
      await api.patch(`/wallets/${fromWallet.id}`, {
        balance: fromWallet.balance - amount,
      });

      const currentAmount = goal.current_amount || 0;
      await api.patch(`/goals/${addMoneyGoalId}`, {
        ...goal,
        current_amount: currentAmount + amount,
      });

      const [walletsData, goalsData] = await Promise.all([
        api.get<Wallet[]>("/wallets"),
        api.get<Goal[]>("/goals"),
      ]);

      const filteredWallets = walletsData.data.filter(
        (w) => String(w.user_id) === String(user.id)
      );
      const filteredGoals = goalsData.data.filter(
        (g) => String(g.user_id) === String(user.id)
      );

      setWallets(filteredWallets);
      setGoals(filteredGoals);

      // Gửi thông báo về tiến độ và hoàn thành mục tiêu
      const updatedGoal = filteredGoals.find((g) => g.id === addMoneyGoalId);
      if (updatedGoal && user?.id) {
        try {
          await checkGoalProgress(user.id, {
            id: updatedGoal.id,
            name: updatedGoal.name,
            current_amount: updatedGoal.current_amount,
            target_amount: updatedGoal.target_amount,
          });
          await checkGoalCompletion(user.id, {
            id: updatedGoal.id,
            name: updatedGoal.name,
            current_amount: updatedGoal.current_amount,
            target_amount: updatedGoal.target_amount,
          });
        } catch (notifyErr) {
          console.error('Error sending goal notifications:', notifyErr);
        }
      }

      setAddMoneyOpen(false);
      setAddMoneyGoalId("");
      setAddMoneyAmount("");
      setAddMoneyFromWallet("");
    } catch (err) {
      alert(t("toast.addMoneyError"));
    }
  };

  const filtered: Goal[] = goals;

  return (
    <>
      <section className="grid gap-3">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="m-0 font-bold text-[32px] leading-tight text-foreground">
              {t("title")}
            </h2>
            <div className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</div>
          </div>
          <Button
            className="bg-[#0b122a] hover:bg-[#1a2645] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            onClick={() => setOpen(true)}
          >
            <span>+</span>
            {t("actions.addGoal")}
          </Button>
        </div>
        <div className="mt-4">
          {loading ? (
            <div className="p-4 text-gray-500 dark:text-gray-400">{t("loading")}</div>
          ) : !Array.isArray(goals) ? (
            <div className="p-4 text-red-700 dark:text-red-300">{t("invalidData")}</div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6">
              <div className="min-h-[120px] flex items-center justify-center">
                <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                  {t("empty.title")}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-3">
              <GoalsSummary
                totalGoals={filtered.length}
                completedGoals={filtered.filter((g) => calcProgress(g.id).completed).length}
                inProgressGoals={filtered.filter((g) => !calcProgress(g.id).completed).length}
              />

              <FavoriteGoals
                favoriteGoalIds={favoriteGoalIds}
                goals={goals}
                wallets={wallets}
                calcProgress={calcProgress}
                getWallet={getWallet}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleFavorite={toggleFavorite}
                onAddMoney={(goalId) => {
                  setAddMoneyGoalId(goalId);
                  setAddMoneyAmount("");
                  setAddMoneyFromWallet("");
                  setAddMoneyOpen(true);
                }}
              />

              <div>
                <h3 className="font-semibold text-xl mb-4 text-foreground">
                  {t("otherGoals.title")}
                </h3>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-3">
                  {filtered.filter((g) => !favoriteGoalIds.has(g.id)).map((g) => {
                    const { current, percent, completed } = calcProgress(g.id);
                    const wallet = getWallet(g.wallet_id);
                    const daysLeft = g.deadline
                      ? Math.ceil(
                          (new Date(g.deadline).getTime() - Date.now()) / 86400000
                        )
                      : null;

                    return (
                      <GoalCard
                        key={g.id}
                        goal={g}
                        wallet={wallet}
                        current={current}
                        percent={percent}
                        completed={completed}
                        daysLeft={daysLeft}
                        isFavorite={favoriteGoalIds.has(g.id)}
                        onEdit={() => handleEdit(g)}
                        onDelete={() => handleDelete(g)}
                        onToggleFavorite={() => toggleFavorite(g.id)}
                        onAddMoney={() => {
                          setAddMoneyGoalId(g.id);
                          setAddMoneyAmount("");
                          setAddMoneyFromWallet("");
                          setAddMoneyOpen(true);
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <GoalModal
        open={open}
        editingId={editingId}
        title={title}
        targetAmount={targetAmount}
        selectedWallet={selectedWallet}
        selectedStatus={selectedStatus}
        dueDate={dueDate}
        initialAmount={initialAmount}
        sourceWallet={sourceWallet}
        wallets={wallets}
        error={error}
        onClose={() => {
          setOpen(false);
          resetForm();
          setEditingId(null);
        }}
        onSubmit={handleSubmit}
        onTitleChange={setTitle}
        onTargetAmountChange={setTargetAmount}
        onStatusChange={setSelectedStatus}
        onDueDateChange={setDueDate}
        onInitialAmountChange={setInitialAmount}
        onSourceWalletChange={setSourceWallet}
      />

      <AddMoneyModal
        open={addMoneyOpen}
        walletName={
          getWallet(
            goals.find((g) => g.id === addMoneyGoalId)?.wallet_id || 0
          )?.name || ""
        }
        amount={addMoneyAmount}
        fromWallet={addMoneyFromWallet}
        wallets={wallets}
        onClose={() => {
          setAddMoneyOpen(false);
          setAddMoneyGoalId("");
          setAddMoneyAmount("");
          setAddMoneyFromWallet("");
        }}
        onSubmit={handleAddMoneySubmit}
        onAmountChange={setAddMoneyAmount}
        onFromWalletChange={setAddMoneyFromWallet}
      />
    </>
  );
}
