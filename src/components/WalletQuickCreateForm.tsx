import { useState } from 'react';
import { X, Wallet } from 'lucide-react';
import api from '../services/api';

interface WalletQuickCreateFormProps {
  userId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function WalletQuickCreateForm({ userId, onClose, onSuccess }: WalletQuickCreateFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'CASH' as 'BANK' | 'E_WALLET' | 'CASH',
    balance: '0',
    color: '#3B82F6'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Vui lòng nhập tên ví');
      return;
    }

    try {
      setLoading(true);
      await api.post('/wallets', {
        user_id: userId,
        name: formData.name,
        type: formData.type,
        balance: Number(formData.balance),
        color: formData.color,
        created_at: new Date().toISOString()
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError('Có lỗi xảy ra khi tạo ví');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Wallet className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold">Tạo ví nhanh</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Tên ví *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border rounded px-3 py-2"
              placeholder="Ví tiền mặt, Ngân hàng..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Loại ví</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              className="w-full border rounded px-3 py-2"
            >
              <option value="CASH">Tiền mặt</option>
              <option value="BANK">Ngân hàng</option>
              <option value="E_WALLET">Ví điện tử</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Số dư ban đầu</label>
            <input
              type="number"
              value={formData.balance}
              onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
              className="w-full border rounded px-3 py-2"
              placeholder="0"
              min="0"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              disabled={loading}
            >
              {loading ? 'Đang tạo...' : 'Tạo ví'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
