import { Button } from "../components/ui/Button";
import { useEffect, useState, useContext } from "react";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";

type Goal = {
  id: string;
  user_id?: number | string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline?: string;
};
export default function Goals() {
  const auth = useContext(AuthContext) as any;
  const user = auth?.user;

  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState<string>("");
  const [targetAmount, setTargetAmount] = useState<string>("");
  const [currentAmount, setCurrentAmount] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");

  const resetForm = () => {
    setTitle("");
    setTargetAmount("");
    setCurrentAmount("");
    setDueDate("");
    setError(null);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get<Goal[]>("/goals");
        console.log("All goals:", data);

        if (user?.id && Array.isArray(data)) {
          // Filter: goal.user_id must match user.id (compare as strings)
          const filtered = data.filter(g => String(g.user_id) === String(user.id));
          console.log("🔍 User ID:", user.id, "| Filtered goals:", filtered);
          setGoals(filtered);
        } else {
          setGoals(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        setError("Tải mục tiêu thất bại");
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
    const current = Number(currentAmount);
    if (!name) { setError("Tên mục tiêu không được để trống"); return; }
    if (isNaN(target) || target <= 0) { setError("Số tiền mục tiêu phải lớn hơn 0"); return; }
    if (isNaN(current) || current < 0) { setError("Số tiền hiện tại không hợp lệ"); return; }

    try {
      if (editingId) {
        const payload = { name, target_amount: target, current_amount: current, deadline: dueDate };
        const { data } = await api.put<Goal>(`/goals/${editingId}`, payload);
        setGoals((prev) => prev.map((g) => g.id === editingId ? { ...g, ...data } : g));
      } else {
        const payload: Partial<Goal> = { name, target_amount: target, current_amount: current, deadline: dueDate };
        if (user?.id) {
          // Try to convert to number if it's a numeric string, otherwise keep as string
          const numId = Number(user.id);
          payload.user_id = !isNaN(numId) && String(numId) === user.id ? numId : user.id;
        }
        const { data } = await api.post<Goal>("/goals", payload);
        setGoals((prev) => [...prev, data]);
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
      <section style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2
              style={{
                margin: 0,
                fontWeight: 700,
                fontSize: 32,
                lineHeight: 1.2,
                color: "#0f172a", // slate-900
                letterSpacing: "0.2px",
              }}
            >
              Mục tiêu tài chính
            </h2>
            <div
              style={{
                marginTop: 8,
                fontSize: 14,
                lineHeight: 1.6,
                color: "#6b7280", // slate-500
              }}
            >
              Theo dõi tiến độ tiết kiệm và đầu tư
            </div>
          </div>
          <Button
            style={{ background: "#0b122a", color: "#fff", padding: "8px 14px", borderRadius: 10, display: "flex", alignItems: "center", gap: 8 }}
            onClick={() => setOpen(true)}
          >
            <span style={{ fontWeight: 700 }}>+</span>
            Thêm mục tiêu
          </Button>
        </div>
        {error && (
          <div style={{ padding: "8px 12px", background: "#fee2e2", color: "#b91c1c", borderRadius: 8 }}>
            {error}
          </div>
        )}
        <div style={{ marginTop: "1rem" }}>

          {loading ? (
            <div style={{ padding: "1rem", color: "#6b7280" }}>Đang tải mục tiêu...</div>
          ) : !Array.isArray(goals) ? (
            <div style={{ padding: "1rem", color: "#b91c1c" }}>Dữ liệu mục tiêu không hợp lệ</div>
          ) : filtered.length === 0 ? (
            <div
              style={{
                borderRadius: "1rem",
                borderStyle: "dashed",
                borderWidth: "0.5px",
                borderColor: "#e5e7eb",
                background: "var(--card, #ffffff)",
                padding: "1.5rem",
                color: "var(--muted-foreground, #7e859344)",
              }}
            >
              <div style={{ minHeight: "120px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ textAlign: "center", fontSize: "0.875rem", color: "var(--muted-foreground, #6b7280)" }}>
                  Chưa có mục tiêu nào. Hãy thêm mục tiêu đầu tiên!
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
                {/* Tổng mục tiêu */}
                <div style={{
                  background: "#fff",
                  borderRadius: 20,
                  padding: 24,
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                }}>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>Tổng mục tiêu</div>
                  <div style={{ marginTop: 12, fontSize: 24, fontWeight: 700, color: "#0f172a" }}>{filtered.length}</div>
                </div>

                {/* Đã hoàn thành */}
                <div style={{
                  background: "#fff",
                  borderRadius: 20,
                  padding: 24,
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                }}>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>Đã hoàn thành</div>
                  <div style={{ marginTop: 12, fontSize: 24, fontWeight: 700, color: "#0f172a" }}>{filtered.filter((g) => g.current_amount >= g.target_amount).length}</div>
                </div>

                {/* Đang thực hiện */}
                <div style={{
                  background: "#fff",
                  borderRadius: 20,
                  padding: 24,
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                }}>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>Đang thực hiện</div>
                  <div style={{ marginTop: 12, fontSize: 24, fontWeight: 700, color: "#0f172a" }}>{filtered.filter((g) => g.current_amount > 0 && g.current_amount < g.target_amount).length}</div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 12 }}>
                {filtered.map((g) => {
                  const percent = g.target_amount === 0 ? 0 : Math.round((g.current_amount / g.target_amount) * 100);
                  const completed = g.current_amount >= g.target_amount;
                  const format = (v: number) => v.toLocaleString("vi-VN");
                  const daysLeft = g.deadline ? Math.ceil((new Date(g.deadline!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

                  return (
                    <div
                      key={g.id}
                      style={{
                        background: "#fff",
                        borderRadius: 10,
                        padding: 16,
                        border: completed ? "2px solid #10b981" : "1px solid #e5e7eb",
                        boxShadow: completed ? "0 0 0 1px #d1fae5 inset" : "0 1px 2px rgba(0,0,0,0.04)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <div>
                          <div style={{ fontWeight: 700 }}>{g.name}</div>
                          <div style={{ fontSize: 12, marginTop: 6 }}>
                            {completed ? (
                              <span style={{ color: "#10b981" }}>✓ Đã hoàn thành!</span>
                            ) : (
                              <span style={{ color: "#6b7280" }}>{daysLeft !== null ? `Còn ${daysLeft} ngày` : ""}</span>
                            )}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            onClick={() => {
                              setEditingId(g.id);
                              setTitle(g.name);
                              setTargetAmount(String(g.target_amount));
                              setCurrentAmount(String(g.current_amount));
                              setDueDate(g.deadline || "");
                              setOpen(true);
                            }}
                            style={{ border: "none", background: "transparent", cursor: "pointer", padding: 4, borderRadius: 6 }}
                            aria-label="Edit"
                          >
                            ✏
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                await api.delete(`/goals/${g.id}`);
                                setGoals((p) => p.filter((x) => x.id !== g.id));
                              } catch (err) {
                                console.error("Delete goal failed", err);
                                alert("Xóa mục tiêu thất bại");
                              }
                            }}
                            style={{ border: "none", background: "transparent", cursor: "pointer", padding: 4, borderRadius: 6 }}
                            aria-label="Delete"
                          >
                            🗑
                          </button>
                        </div>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#6b7280", marginBottom: 10 }}>
                        <div>Hiện tại: {format(g.current_amount)} đ</div>
                        <div>Mục tiêu: {format(g.target_amount)} đ</div>
                      </div>

                      <div style={{ height: 10, background: "#e5e7eb", borderRadius: 999, overflow: "hidden", marginBottom: 8 }}>
                        <div
                          style={{
                            width: `${Math.max(0, Math.min(100, percent))}%`,
                            height: "100%",
                            background: "#0b122a",
                          }}
                        />
                      </div>
                      <div style={{ textAlign: "center", fontSize: 12, color: "#6b7280", marginBottom: 8 }}>
                        {Math.max(0, Math.min(100, percent))}% hoàn thành
                      </div>

                      <div style={{ borderTop: "1px solid #eef2f6", marginTop: 12, paddingTop: 12, fontSize: 13, color: "#6b7280", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>Còn thiếu: {format(Math.max(0, g.target_amount - g.current_amount))} đ</div>
                        {!completed && (
                          <Button
                            style={{ background: "#0b122a", color: "#fff", padding: "8px 14px", borderRadius: 10 }}
                            onClick={() => {
                              setEditingId(g.id);
                              setTitle(g.name);
                              setTargetAmount(String(g.target_amount));
                              setCurrentAmount(String(g.current_amount));
                              setDueDate(g.deadline || "");
                              setOpen(true);
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
        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(15, 23, 42, 0.5)",
            zIndex: 60,
          }}
        >
          <div style={{ width: 480, background: "#fff", borderRadius: 8, boxShadow: "0 10px 30px rgba(2,6,23,0.4)", padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontWeight: 700 }}>{editingId ? "Cập nhật mục tiêu" : "Thêm mục tiêu mới"}</h3>
              <button
                aria-label="Close"
                onClick={() => {
                  setOpen(false);
                  resetForm();
                  setEditingId(null);
                }}
                style={{ border: "none", background: "transparent", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>Tạo một mục tiêu mới</div>

            <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
              {error && <div style={{ color: "#b91c1c", fontSize: 13 }}>{error}</div>}

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "#1f2937" }}>Tên mục tiêu</label>
                <input
                  placeholder="VD: Mua nhà, Du lịch..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", borderRadius: 4, border: "1px solid #e5e7eb" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "#1f2937" }}>Số tiền mục tiêu (VNĐ)</label>
                <input
                  type="number"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", borderRadius: 4, border: "1px solid #e5e7eb" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "#1f2937" }}>Số tiền hiện tại (VNĐ)</label>
                <input
                  type="number"
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value)}
                  style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", borderRadius: 4, border: "1px solid #e5e7eb" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "#1f2937" }}>Hạn hoàn thành</label>
                <input
                  type="date"
                  placeholder="Hạn hoàn thành"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", borderRadius: 4, border: "1px solid #e5e7eb" }}
                />
              </div>

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
                <Button style={{ flex: 1, background: "#000", color: "#fff", padding: "10px 24px" }} type="submit">
                  {editingId ? "Cập nhật" : "Thêm"}
                </Button>

                <Button
                  variant="outline"
                  style={{ minWidth: 60, padding: "10px 16px" }}
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
    </>
  );
}