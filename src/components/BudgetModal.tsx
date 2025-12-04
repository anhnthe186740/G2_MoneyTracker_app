import { useEffect, useState, type FormEvent, type ChangeEvent } from 'react';
import { useBudgetContext } from '../context/BudgetContext';
import { useAuth } from '../context/AuthContext';
import type { Budget, Category } from '../types';

interface BudgetModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingBudget: Budget | null;
    categories: Category[];
}

export default function BudgetModal({
    isOpen,
    onClose,
    editingBudget,
    categories,
}: BudgetModalProps) {
    const { user } = useAuth();
    const { budgets, createBudget, updateBudget, loading, error } = useBudgetContext();

    const [form, setForm] = useState({
        category_id: '',
        limit_amount: '',
        start_date: '',
        end_date: '',
        description: '',
    });

    const [formError, setFormError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Reset form when modal opens or editingBudget changes
    useEffect(() => {
        if (isOpen) {
            if (editingBudget) {
                // Safe date parsing
                const parseDate = (dateStr?: string | null): string => {
                    if (!dateStr) return '';
                    try {
                        // If already in YYYY-MM-DD format, return as is
                        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                            return dateStr;
                        }
                        // Otherwise parse and format
                        const date = new Date(dateStr);
                        if (isNaN(date.getTime())) return '';
                        return date.toISOString().slice(0, 10);
                    } catch {
                        return '';
                    }
                };

                setForm({
                    category_id: editingBudget.category_id?.toString() || '',
                    limit_amount: editingBudget.limit_amount?.toString() || '',
                    start_date: parseDate(editingBudget.start_date),
                    end_date: parseDate(editingBudget.end_date),
                    description: editingBudget.description || '',
                });
            } else {
                const today = new Date();
                const first = new Date(today.getFullYear(), today.getMonth(), 1);
                const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                setForm({
                    category_id: '',
                    limit_amount: '',
                    start_date: first.toISOString().slice(0, 10),
                    end_date: last.toISOString().slice(0, 10),
                    description: '',
                });
            }
            setFormError(null);
        }
    }, [isOpen, editingBudget]);

    if (!isOpen) return null;

    const handleFormChange = (
        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setFormError(null);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!user) return;

        if (!form.category_id || !form.limit_amount || !form.start_date || !form.end_date) {
            setFormError('Vui lòng điền đầy đủ các trường bắt buộc.');
            return;
        }

        const limit = Number(form.limit_amount);
        if (Number.isNaN(limit) || limit <= 0) {
            setFormError('Hạn mức phải là số lớn hơn 0.');
            return;
        }

        const start = new Date(form.start_date);
        const end = new Date(form.end_date);
        if (start > end) {
            setFormError('Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc.');
            return;
        }

        const payload: Omit<Budget, 'id' | 'created_at'> = {
            user_id: user.id,
            category_id: Number(form.category_id),
            limit_amount: limit,
            start_date: form.start_date,
            end_date: form.end_date,
            description: form.description.trim(),
            status: 'ACTIVE',
        };

        // Validate: không cho phép trùng danh mục + khoảng thời gian chồng lắp
        const newStart = new Date(payload.start_date);
        const newEnd = new Date(payload.end_date);

        const hasConflict = budgets.some((b) => {
            // Bỏ qua chính nó khi đang chỉnh sửa
            if (editingBudget && b.id === editingBudget.id) return false;

            // Chỉ kiểm tra với ngân sách cùng user + cùng category + còn ACTIVE
            if (Number(b.user_id) !== Number(payload.user_id)) return false;
            if (String(b.category_id) !== String(payload.category_id)) return false;
            if (b.status === 'CANCELLED') return false;

            const existingStart = new Date(b.start_date);
            const existingEnd = new Date(b.end_date);

            // Hai khoảng thời gian giao nhau nếu không rơi vào trường hợp "mới hoàn toàn trước" hoặc "mới hoàn toàn sau"
            const isNonOverlapping =
                newEnd < existingStart || newStart > existingEnd;

            return !isNonOverlapping;
        });

        if (hasConflict) {
            setFormError('Bạn đã có một ngân sách khác cho danh mục này trong khoảng thời gian trùng lặp. Vui lòng chỉnh lại ngày hoặc chọn danh mục khác.');
            return;
        }

        try {
            setSubmitting(true);
            if (editingBudget) {
                await updateBudget(editingBudget.id, payload);
            } else {
                await createBudget(payload);
            }
            onClose();
        } catch (err) {
            console.error(err);
            setFormError('Không thể lưu ngân sách. Vui lòng thử lại.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-lg overflow-hidden rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200"
                style={{ backgroundColor: '#ffffff' }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b p-4" style={{ backgroundColor: '#f8f9fa' }}>
                    <h2 className="text-lg font-bold" style={{ color: '#1f2937' }}>
                        {editingBudget ? 'Chỉnh sửa ngân sách' : 'Thêm ngân sách mới'}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-1 transition-colors"
                        style={{ color: '#6b7280' }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f3f4f6';
                            e.currentTarget.style.color = '#1f2937';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = '#6b7280';
                        }}
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6" style={{ backgroundColor: '#ffffff' }}>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1">
                            <label htmlFor="category_id" className="text-sm font-medium" style={{ color: '#1f2937' }}>
                                Danh mục chi tiêu <span style={{ color: '#dc2626' }}>*</span>
                            </label>
                            <select
                                id="category_id"
                                name="category_id"
                                value={form.category_id}
                                onChange={handleFormChange}
                                className="block w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                                style={{
                                    backgroundColor: '#ffffff',
                                    borderColor: '#d1d5db',
                                    color: '#1f2937'
                                }}
                            >
                                <option value="">-- Chọn danh mục --</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label htmlFor="limit_amount" className="text-sm font-medium" style={{ color: '#1f2937' }}>
                                Hạn mức tối đa (VND) <span style={{ color: '#dc2626' }}>*</span>
                            </label>
                            <input
                                id="limit_amount"
                                name="limit_amount"
                                type="number"
                                min={0}
                                value={form.limit_amount}
                                onChange={handleFormChange}
                                className="block w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                                style={{
                                    backgroundColor: '#ffffff',
                                    borderColor: '#d1d5db',
                                    color: '#1f2937'
                                }}
                                placeholder="Ví dụ: 5000000"
                            />
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1">
                                <label htmlFor="start_date" className="text-sm font-medium" style={{ color: '#1f2937' }}>
                                    Bắt đầu từ ngày <span style={{ color: '#dc2626' }}>*</span>
                                </label>
                                <input
                                    id="start_date"
                                    name="start_date"
                                    type="date"
                                    value={form.start_date}
                                    onChange={handleFormChange}
                                    className="block w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                                    style={{
                                        backgroundColor: '#ffffff',
                                        borderColor: '#d1d5db',
                                        color: '#1f2937'
                                    }}
                                />
                            </div>
                            <div className="space-y-1">
                                <label htmlFor="end_date" className="text-sm font-medium" style={{ color: '#1f2937' }}>
                                    Kết thúc vào ngày <span style={{ color: '#dc2626' }}>*</span>
                                </label>
                                <input
                                    id="end_date"
                                    name="end_date"
                                    type="date"
                                    value={form.end_date}
                                    onChange={handleFormChange}
                                    className="block w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                                    style={{
                                        backgroundColor: '#ffffff',
                                        borderColor: '#d1d5db',
                                        color: '#1f2937'
                                    }}
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label htmlFor="description" className="text-sm font-medium" style={{ color: '#1f2937' }}>
                                Ghi chú (không bắt buộc)
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                value={form.description}
                                onChange={handleFormChange}
                                rows={3}
                                className="block w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                                style={{
                                    backgroundColor: '#ffffff',
                                    borderColor: '#d1d5db',
                                    color: '#1f2937'
                                }}
                                placeholder="Ví dụ: Ngân sách ăn uống tháng 12..."
                            />
                        </div>

                        {formError && <p className="text-sm text-destructive">{formError}</p>}
                        {error && <p className="text-sm text-destructive">Lỗi hệ thống: {error}</p>}

                        <div className="pt-2 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-xl border bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted"
                                style={{
                                    backgroundColor: '#ffffff',
                                    borderColor: '#d1d5db',
                                    color: '#1f2937'
                                }}
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="submit"
                                disabled={submitting || loading}
                                className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {submitting ? 'Đang lưu...' : editingBudget ? 'Cập nhật' : 'Tạo mới'}
                            </button>

                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
