import { Button } from "../components/ui/Button";
import { useEffect, useState, useContext } from "react";
import { useTranslation } from "react-i18next";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";

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

  const getWallet = (walletId: number) => wallets.find(w => Number(w.id) === Number(walletId));
  const calcProgress = (goalId: string) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return { current: 0, percent: 0, completed: false };
    const current =
      goal.current_amount !== undefined
        ? goal.current_amount
        : getWallet(goal.wallet_id)?.balance || 0;
    const percent =
      goal.target_amount === 0
        ? 0
        : Math.round((current / goal.target_amount) * 100);
    return { current, percent, completed: percent >= 100 };
  };
  const format = (v: number) => v.toLocaleString();

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
        setError(t("validation.insufficientBalance", { 
          wallet: fromWallet.name, 
          balance: format(fromWallet.balance) 
        }));
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
      if (!editingId && initAmount > 0) {
        payload.current_amount = initAmount;
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
            const wallet = wallets.find((w) => String(w.id) === String(walletId));
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

  const filtered: Goal[] = goals;

  return (
    <>
      <section className="grid gap-3">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="m-0 font-bold text-[32px] leading-tight text-slate-900">
              {t("title")}
            </h2>
            <div className="mt-2 text-sm text-gray-500">
              {t("subtitle")}
            </div>
          </div>
          <Button
            className="bg-[#0b122a] hover:bg-[#1a2645] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            onClick={() => setOpen(true)}
          >
            <span>+</span>
            {t("actions.addGoal")}
          </Button>
        </div>
        {error && (
          <div className="px-3 py-2 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        <div className="mt-4">
          {loading ? (
            <div className="p-4 text-gray-500">{t("loading")}</div>
          ) : !Array.isArray(goals) ? (
            <div className="p-4 text-red-700">
              {t("invalidData")}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6">
              <div className="min-h-[120px] flex items-center justify-center">
                <div className="text-center text-sm text-gray-500">
                  {t("empty.title")}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-3">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-sm font-medium text-gray-600 mb-1">
                    {t("summary.totalGoals")}
                  </div>
                  <div className="text-3xl font-bold text-slate-900">
                    {filtered.length}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-sm font-medium text-green-700 mb-1">
                    {t("summary.completed")}
                  </div>
                  <div className="text-3xl font-bold text-green-600">
                    {
                      filtered.filter((g) => calcProgress(g.id).completed)
                        .length
                    }
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-sm font-medium text-blue-700 mb-1">
                    {t("summary.inProgress")}
                  </div>
                  <div className="text-3xl font-bold text-blue-600">
                    {
                      filtered.filter((g) => !calcProgress(g.id).completed)
                        .length
                    }
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-3">
                {filtered.map((g) => {
                  const { current, percent, completed } = calcProgress(g.id);
                  const wallet = getWallet(g.wallet_id);
                  const daysLeft = g.deadline
                    ? Math.ceil(
                        (new Date(g.deadline).getTime() - Date.now()) / 86400000
                      )
                    : null;

                  return (
                    <div
                      key={g.id}
                      className={`rounded-xl p-4 ${completed
                          ? "bg-green-50 border-2 border-green-400 shadow-sm"
                          : "bg-white border border-gray-200 shadow-sm"
                        }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-bold text-gray-800">
                            {g.name}
                          </div>
                          <div className="text-[11px] text-gray-500 mt-1">
                            {t("card.wallet")}: {wallet?.name || t("card.notAvailable")}
                          </div>
                          <div className="text-xs mt-1.5">
                            {completed ? (
                              <span className="text-green-600 font-semibold">
                                {t("card.completed")}
                              </span>
                            ) : (
                              <span className="text-gray-500">
                                {daysLeft !== null

                                  ? t("card.daysLeft", { days: daysLeft })
                                  : t("card.progress", { percent })}

                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingId(g.id);
                              setTitle(g.name);
                              setTargetAmount(String(g.target_amount));
                              setSelectedWallet(String(g.wallet_id));
                              setSelectedStatus(g.status);
                              setDueDate(g.deadline || "");
                              setOpen(true);
                            }}
                            className="border-none bg-transparent hover:bg-gray-100 cursor-pointer p-1 rounded transition-colors text-blue-600 text-sm"
                            aria-label="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={async () => {
                              if (
                                !window.confirm(t("confirm.delete", { name: g.name }))
                              ) {
                                return;
                              }

                              try {
                                if (
                                  g.current_amount &&
                                  g.current_amount > 0 &&
                                  g.wallet_id
                                ) {
                                  const wallet = wallets.find(
                                    (w) => Number(w.id) === Number(g.wallet_id)
                                  );
                                  if (wallet) {
                                    await api.patch(`/wallets/${wallet.id}`, {
                                      balance:
                                        wallet.balance + g.current_amount,
                                    });

                                    const { data: walletsData } = await api.get<
                                      Wallet[]
                                    >("/wallets");
                                    const filteredWallets = walletsData.filter(
                                      (w: Wallet) =>
                                        String(w.user_id) === String(user.id)
                                    );
                                    setWallets(filteredWallets);
                                  }
                                }

                                await api.delete(`/goals/${g.id}`);
                                setGoals((p) => p.filter((x) => x.id !== g.id));

                              } catch {
                                alert(t("toast.deleteError"));

                              }
                            }}
                            className="border-none bg-transparent hover:bg-gray-100 cursor-pointer p-1 rounded transition-colors text-red-600 text-sm"
                            aria-label="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between text-[13px] text-gray-500 mb-2">
                        <div>{t("card.current")}: {format(current)} {t("currency")}</div>
                        <div>{t("card.target")}: {format(g.target_amount)} {t("currency")}</div>
                      </div>

                      <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden mb-2">
                        <div
                          className={`h-full ${completed ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                          style={{ width: `${Math.min(100, percent)}%` }}
                        />
                      </div>
                      <div className="text-center text-xs text-gray-500 mb-2">
                        {t("card.percentComplete", { percent: Math.min(100, percent) })}
                      </div>

                      <div className="border-t border-gray-100 mt-3 pt-3 text-[13px] text-gray-600 flex justify-between items-center">
                        <div>
                          {t("card.remaining")}:{" "}
                          <span className="font-semibold">
                            {format(Math.max(0, g.target_amount - current))} {t("currency")}
                          </span>
                        </div>
                        {!completed && (
                          <Button
                            className="bg-[#0b122a] hover:bg-[#1a2645] text-white px-3.5 py-1.5 rounded-lg text-sm transition-colors"
                            onClick={() => {
                              setAddMoneyGoalId(g.id);
                              setAddMoneyAmount("");
                              setAddMoneyFromWallet("");
                              setAddMoneyOpen(true);
                            }}
                          >
                            {t("actions.addMoney")}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {open && (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-900/50 z-[60]">
          <div className="w-[480px] bg-white rounded-lg shadow-2xl p-5">
            <div className="flex justify-between items-center mb-3">
              <h3 className="m-0 font-bold">
                {editingId ? t("dialog.editTitle") : t("dialog.addTitle")}
              </h3>
              <button
                aria-label="Close"
                onClick={() => {
                  setOpen(false);
                  resetForm();
                  setEditingId(null);
                }}
                className="border-none bg-transparent cursor-pointer text-xl hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="text-[13px] text-gray-500 mb-3">
              {editingId ? (
                <>
                  {t("dialog.editDescription")}:{" "}
                  <strong>
                    {wallets.find(
                      (w) => Number(w.id) === Number(selectedWallet)
                    )?.name || t("card.notAvailable")}
                  </strong>
                </>
              ) : (
                t("dialog.addDescription")
              )}
            </div>

            <form onSubmit={handleSubmit} className="grid gap-3">
              {error && <div className="text-red-700 text-[13px]">{error}</div>}

              <div>
                <label className="block text-[13px] font-medium mb-1.5 text-gray-800">
                  {t("form.name")}
                </label>
                <input
                  placeholder={t("form.namePlaceholder")}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full box-border px-2.5 py-2 rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium mb-1.5 text-gray-800">
                  {t("form.targetAmount")}
                </label>
                <input
                  type="text"
                  value={targetAmount ? Number(targetAmount).toLocaleString() : ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setTargetAmount(value);
                  }}
                  placeholder={t("form.targetAmountPlaceholder")}
                  className="w-full box-border px-2.5 py-2 rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {!editingId && (
                <>
                  <div>
                    <label className="block text-[13px] font-medium mb-1.5 text-gray-800">
                      {t("form.currentAmount")}
                    </label>
                    <input
                      type="text"
                      value={initialAmount ? Number(initialAmount).toLocaleString() : ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        setInitialAmount(value);
                      }}
                      placeholder={t("form.currentAmountPlaceholder")}
                      className="w-full box-border px-2.5 py-2 rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium mb-1.5 text-gray-800">
                      {t("form.sourceWallet")}
                    </label>
                    <select
                      value={sourceWallet}
                      onChange={(e) => setSourceWallet(e.target.value)}
                      className="w-full box-border px-2.5 py-2 rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={!initialAmount || Number(initialAmount) <= 0}
                    >
                      <option value="">{t("form.selectWallet")}</option>
                      {wallets.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} ({w.balance.toLocaleString()} {t("currency")})
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-[13px] font-medium mb-1.5 text-gray-800">
                  {t("form.status")}
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full box-border px-2.5 py-2 rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="inProgress">{t("status.inProgress")}</option>
                  <option value="paused">{t("status.paused")}</option>
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-medium mb-1.5 text-gray-800">
                  {t("form.deadline")}
                </label>
                <input
                  type="date"
                  placeholder={t("form.deadline")}
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full box-border px-2.5 py-2 rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-2 justify-end mt-3">
                <Button
                  className="flex-1 bg-black text-white px-6 py-2.5"
                  type="submit"
                >
                  {editingId ? t("actions.update") : t("actions.add")}
                </Button>

                <Button
                  variant="outline"
                  className="min-w-[60px] px-4 py-2.5"
                  onClick={() => {
                    setOpen(false);
                    resetForm();
                    setEditingId(null);
                  }}
                  type="button"
                >
                  {t("actions.cancel")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Money Modal */}
      {addMoneyOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-900/50 z-[60]">
          <div className="w-[480px] bg-white rounded-lg shadow-2xl p-5">
            <div className="flex justify-between items-center mb-3">
              <h3 className="m-0 font-bold">{t("dialog.addMoneyTitle")}</h3>
              <button
                aria-label="Close"
                onClick={() => {
                  setAddMoneyOpen(false);
                  setAddMoneyGoalId("");
                  setAddMoneyAmount("");
                  setAddMoneyFromWallet("");
                }}
                className="border-none bg-transparent cursor-pointer text-xl hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="text-[13px] text-gray-500 mb-3">
              {t("card.wallet")}:{" "}
              <strong>
                {getWallet(
                  goals.find((g) => g.id === addMoneyGoalId)?.wallet_id || 0
                )?.name || t("card.notAvailable")}
              </strong>
            </div>

            <form
              className="grid gap-3"
              onSubmit={async (e) => {
                e.preventDefault();
                const amount = Number(addMoneyAmount);
                const fromWalletId = addMoneyFromWallet;

                if (isNaN(amount) || amount <= 0) {
                  alert(t("validation.amountMustBePositive"));
                  return;
                }

                if (isNaN(fromWalletId) || fromWalletId <= 0) {
                  alert(t("validation.selectWallet"));

                  return;
                }

                const goal = goals.find((g) => g.id === addMoneyGoalId);
                const fromWallet = wallets.find(
                  (w) => String(w.id) === String(fromWalletId)
                );
                const toWallet = wallets.find(
                  (w) => String(w.id) === String(goal?.wallet_id)
                );

                if (!fromWallet || !toWallet) {
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

                  setAddMoneyOpen(false);
                  setAddMoneyGoalId("");
                  setAddMoneyAmount("");
                  setAddMoneyFromWallet("");
                } catch (err) {
                  alert(t("toast.addMoneyError"));
                }
              }}
            >
              <div>
                <label className="block text-[13px] font-medium mb-1.5 text-gray-800">
                  {t("form.amountToAdd")}
                </label>
                <input
                  type="text"
                  value={addMoneyAmount ? Number(addMoneyAmount).toLocaleString() : ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setAddMoneyAmount(value);
                  }}
                  placeholder={t("form.amountPlaceholder")}
                  className="w-full box-border px-2.5 py-2 rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium mb-1.5 text-gray-800">
                  {t("form.sourceWallet")}
                </label>
                <select
                  value={addMoneyFromWallet}
                  onChange={(e) => setAddMoneyFromWallet(e.target.value)}
                  className="w-full box-border px-2.5 py-2 rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >

                  <option value="">{t("form.selectSourceWallet")}</option>
                  {wallets
                    .filter((w) => {
                      const goal = goals.find((g) => g.id === addMoneyGoalId);
                      return Number(w.id) !== Number(goal?.wallet_id);
                    })
                    .map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.balance.toLocaleString()} {t("currency")})
                      </option>
                    ))}

                </select>
              </div>

              <div className="flex gap-2 justify-end mt-3">
                <Button
                  className="flex-1 bg-black text-white px-6 py-2.5"
                  type="submit"
                >
                  {t("actions.confirm")}
                </Button>

                <Button
                  variant="outline"
                  className="min-w-[60px] px-4 py-2.5"
                  onClick={() => {
                    setAddMoneyOpen(false);
                    setAddMoneyGoalId("");
                    setAddMoneyAmount("");
                    setAddMoneyFromWallet("");
                  }}
                  type="button"
                >
                  {t("actions.cancel")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
