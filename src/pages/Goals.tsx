import { Button } from "../components/ui/Button";
import { useEffect, useState, useContext } from "react";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";

type Goal = {
  id: string;
  user_id?: number | string;
  wallet_id: number;
  name: string;
  target_amount: number;
  current_amount?: number;
  deadline?: string;
  status: string;
};

type Wallet = {
  id: number;
  user_id: number;
  name: string;
  balance: number;
};
export default function Goals() {
  const auth = useContext(AuthContext) as any;
  const user = auth?.user;

  const [goals, setGoals] = useState<Goal[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getWallet = (walletId: number) =>
    wallets.find((w) => Number(w.id) === Number(walletId));
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
  const format = (v: number) => v.toLocaleString("vi-VN");

  const [open, setOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState<string>("");
  const [targetAmount, setTargetAmount] = useState<string>("");
  const [selectedWallet, setSelectedWallet] = useState<string>("");
  const [selectedStatus, setSelectedStatus] =
    useState<string>("Đang thực hiện");
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
    setSelectedStatus("Đang thực hiện");
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
        setError("Tải dữ liệu thất bại");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const name = title.trim();
    const target = Number(targetAmount);

    if (!name) {
      setError("Tên mục tiêu không được để trống");
      return;
    }
    if (isNaN(target) || target <= 0) {
      setError("Số tiền mục tiêu phải lớn hơn 0");
      return;
    }

    const initAmount = Number(initialAmount) || 0;

    if (!editingId && initAmount > 0) {
      const srcWalletId = Number(sourceWallet);

      if (isNaN(srcWalletId) || srcWalletId <= 0) {
        setError("Vui lòng chọn ví nguồn để lấy tiền");
        return;
      }

      const fromWallet = wallets.find((w) => Number(w.id) === srcWalletId);
      if (!fromWallet) {
        setError("Không tìm thấy ví nguồn");
        return;
      }

      if (fromWallet.balance < initAmount) {
        setError(
          `Số dư ví "${fromWallet.name}" không đủ (còn ${format(
            fromWallet.balance
          )} đ)`
        );
        return;
      }
    }

    try {
      const walletId = editingId
        ? Number(selectedWallet)
        : initAmount > 0
        ? Number(sourceWallet)
        : 0;
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
        const { data } = await api.post<Goal>("/goals", payload);
        setGoals((prev) => [...prev, data]);

        if (initAmount > 0 && walletId > 0) {
          const wallet = wallets.find((w) => Number(w.id) === walletId);
          if (wallet) {
            await api.patch(`/wallets/${walletId}`, {
              balance: wallet.balance - initAmount,
            });

            const { data: walletsData } = await api.get<Wallet[]>("/wallets");
            const filteredWallets = walletsData.filter(
              (w: Wallet) => String(w.user_id) === String(user.id)
            );
            setWallets(filteredWallets);
          }
        }
      }
      setOpen(false);
      resetForm();
      setEditingId(null);
    } catch (err) {
      setError("Lưu mục tiêu thất bại");
    }
  };

  const filtered: Goal[] = goals;

  return (
    <>
      <section className="grid gap-3">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="m-0 font-bold text-[32px] leading-tight text-slate-900">
              Mục tiêu tài chính
            </h2>
            <div className="mt-2 text-sm text-gray-500">
              Theo dõi tiến độ tiết kiệm và đầu tư
            </div>
          </div>
          <Button
            className="bg-[#0b122a] hover:bg-[#1a2645] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            onClick={() => setOpen(true)}
          >
            <span>+</span>
            Thêm mục tiêu
          </Button>
        </div>
        {error && (
          <div className="px-3 py-2 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        <div className="mt-4">
          {loading ? (
            <div className="p-4 text-gray-500">Đang tải mục tiêu...</div>
          ) : !Array.isArray(goals) ? (
            <div className="p-4 text-red-700">
              Dữ liệu mục tiêu không hợp lệ
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6">
              <div className="min-h-[120px] flex items-center justify-center">
                <div className="text-center text-sm text-gray-500">
                  Chưa có mục tiêu nào. Hãy thêm mục tiêu đầu tiên!
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-3">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-sm font-medium text-gray-600 mb-1">
                    Tổng mục tiêu
                  </div>
                  <div className="text-3xl font-bold text-slate-900">
                    {filtered.length}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-sm font-medium text-green-700 mb-1">
                    Đã hoàn thành
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
                    Đang thực hiện
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
                      className={`rounded-xl p-4 ${
                        completed
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
                            Ví: {wallet?.name || "N/A"}
                          </div>
                          <div className="text-xs mt-1.5">
                            {completed ? (
                              <span className="text-green-600 font-semibold">
                                ✓ Hoàn thành
                              </span>
                            ) : (
                              <span className="text-gray-500">
                                {daysLeft !== null
                                  ? `Còn ${daysLeft} ngày`
                                  : `Tiến độ: ${percent}%`}
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
                                !window.confirm(
                                  `Bạn có chắc muốn xóa mục tiêu "${g.name}"?`
                                )
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
                                    await api.patch(`/wallets/${g.wallet_id}`, {
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
                                alert("Xóa mục tiêu thất bại");
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
                        <div>Hiện tại: {format(current)} đ</div>
                        <div>Mục tiêu: {format(g.target_amount)} đ</div>
                      </div>

                      <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden mb-2">
                        <div
                          className={`h-full ${
                            completed ? "bg-green-500" : "bg-blue-500"
                          }`}
                          style={{ width: `${Math.min(100, percent)}%` }}
                        />
                      </div>
                      <div className="text-center text-xs text-gray-500 mb-2">
                        {Math.min(100, percent)}% hoàn thành
                      </div>

                      <div className="border-t border-gray-100 mt-3 pt-3 text-[13px] text-gray-600 flex justify-between items-center">
                        <div>
                          Còn thiếu:{" "}
                          <span className="font-semibold">
                            {format(Math.max(0, g.target_amount - current))} đ
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
                            Thêm tiền
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
                {editingId ? "Cập nhật mục tiêu" : "Thêm mục tiêu mới"}
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
                  Chỉnh sửa mục tiêu:{" "}
                  <strong>
                    {wallets.find(
                      (w) => Number(w.id) === Number(selectedWallet)
                    )?.name || "N/A"}
                  </strong>
                </>
              ) : (
                "Tạo một mục tiêu mới"
              )}
            </div>

            <form onSubmit={handleSubmit} className="grid gap-3">
              {error && <div className="text-red-700 text-[13px]">{error}</div>}

              <div>
                <label className="block text-[13px] font-medium mb-1.5 text-gray-800">
                  Tên mục tiêu
                </label>
                <input
                  placeholder="VD: Mua nhà, Du lịch..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full box-border px-2.5 py-2 rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium mb-1.5 text-gray-800">
                  Số tiền mục tiêu (VNĐ)
                </label>
                <input
                  type="text"
                  value={targetAmount ? Number(targetAmount).toLocaleString('vi-VN') : ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setTargetAmount(value);
                  }}
                  placeholder="Nhập số tiền mục tiêu"
                  className="w-full box-border px-2.5 py-2 rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {!editingId && (
                <>
                  <div>
                    <label className="block text-[13px] font-medium mb-1.5 text-gray-800">
                      Số tiền hiện tại (VNĐ)
                    </label>
                    <input
                      type="text"
                      value={initialAmount ? Number(initialAmount).toLocaleString('vi-VN') : ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        setInitialAmount(value);
                      }}
                      placeholder="Nhập số tiền muốn nạp"
                      className="w-full box-border px-2.5 py-2 rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium mb-1.5 text-gray-800">
                      Lấy từ ví
                    </label>
                    <select
                      value={sourceWallet}
                      onChange={(e) => setSourceWallet(e.target.value)}
                      className="w-full box-border px-2.5 py-2 rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={!initialAmount || Number(initialAmount) <= 0}
                    >
                      <option value="">-- Chọn ví --</option>
                      {wallets.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} ({w.balance.toLocaleString("vi-VN")} đ)
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-[13px] font-medium mb-1.5 text-gray-800">
                  Trạng thái
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full box-border px-2.5 py-2 rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Đang thực hiện">Đang thực hiện</option>
                  <option value="Tạm dừng">Tạm dừng</option>
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-medium mb-1.5 text-gray-800">
                  Hạn hoàn thành
                </label>
                <input
                  type="date"
                  placeholder="Hạn hoàn thành"
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
                  {editingId ? "Cập nhật" : "Thêm"}
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
                  Hủy
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
              <h3 className="m-0 font-bold">Thêm tiền vào mục tiêu</h3>
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
              Chuyển tiền vào ví:{" "}
              <strong>
                {getWallet(
                  goals.find((g) => g.id === addMoneyGoalId)?.wallet_id || 0
                )?.name || "N/A"}
              </strong>{" "}
              để tăng tiến độ
            </div>

            <form
              className="grid gap-3"
              onSubmit={async (e) => {
                e.preventDefault();
                const amount = Number(addMoneyAmount);
                const fromWalletId = Number(addMoneyFromWallet);

                if (isNaN(amount) || amount <= 0) {
                  alert("Số tiền phải lớn hơn 0");
                  return;
                }
                if (isNaN(fromWalletId) || fromWalletId <= 0) {
                  alert("Vui lòng chọn ví nguồn");
                  return;
                }

                const goal = goals.find((g) => g.id === addMoneyGoalId);
                const fromWallet = wallets.find(
                  (w) => Number(w.id) === fromWalletId
                );
                const toWallet = wallets.find(
                  (w) => Number(w.id) === Number(goal?.wallet_id)
                );

                if (!fromWallet || !toWallet) {
                  alert("Không tìm thấy ví");
                  return;
                }

                if (fromWallet.balance < amount) {
                  alert("Số dư ví nguồn không đủ");
                  return;
                }

                if (!goal) {
                  alert("Không tìm thấy mục tiêu");
                  return;
                }

                try {
                  await api.patch(`/wallets/${fromWalletId}`, {
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
                  alert("Thêm tiền thất bại");
                }
              }}
            >
              <div>
                <label className="block text-[13px] font-medium mb-1.5 text-gray-800">
                  Số tiền cần thêm (VNĐ)
                </label>
                <input
                  type="text"
                  value={addMoneyAmount ? Number(addMoneyAmount).toLocaleString('vi-VN') : ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setAddMoneyAmount(value);
                  }}
                  placeholder="Nhập số tiền"
                  className="w-full box-border px-2.5 py-2 rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium mb-1.5 text-gray-800">
                  Lấy từ ví
                </label>
                <select
                  value={addMoneyFromWallet}
                  onChange={(e) => setAddMoneyFromWallet(e.target.value)}
                  className="w-full box-border px-2.5 py-2 rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Chọn ví nguồn --</option>
                  {wallets
                    .filter((w) => {
                      const goal = goals.find((g) => g.id === addMoneyGoalId);
                      return Number(w.id) !== Number(goal?.wallet_id);
                    })
                    .map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.balance.toLocaleString("vi-VN")} đ)
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex gap-2 justify-end mt-3">
                <Button
                  className="flex-1 bg-black text-white px-6 py-2.5"
                  type="submit"
                >
                  Xác nhận
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
                  Hủy
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
