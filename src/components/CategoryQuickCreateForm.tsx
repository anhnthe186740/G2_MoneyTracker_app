import { useState } from 'react';
import { X, Tag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

interface CategoryQuickCreateFormProps {
  userId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CategoryQuickCreateForm({ userId, onClose, onSuccess }: CategoryQuickCreateFormProps) {
  const { t } = useTranslation('transactions');
  const [formData, setFormData] = useState({
    name: '',
    type: 'EXPENSE' as 'INCOME' | 'EXPENSE',
    color: '#EF4444',
    icon: '💸'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError(t('quickCreate.nameRequired'));
      return;
    }

    try {
      setLoading(true);
      await api.post('/categories', {
        user_id: userId,
        name: formData.name,
        type: formData.type,
        color: formData.color,
        icon: formData.icon
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(t('quickCreate.createError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Tag className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold">{t('quickCreate.title')}</h2>
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
            <label className="block text-sm font-medium mb-2">{t('quickCreate.nameLabel')}</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border rounded px-3 py-2"
              placeholder={t('quickCreate.namePlaceholder')}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('quickCreate.typeLabel')}</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="EXPENSE"
                  checked={formData.type === 'EXPENSE'}
                  onChange={(e) => setFormData({
                    ...formData,
                    type: e.target.value as 'EXPENSE',
                    color: '#EF4444',
                    icon: '💸'
                  })}
                  className="mr-2"
                />
                {t('categoryManagement.expense')}
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="INCOME"
                  checked={formData.type === 'INCOME'}
                  onChange={(e) => setFormData({
                    ...formData,
                    type: e.target.value as 'INCOME',
                    color: '#10B981',
                    icon: '💰'
                  })}
                  className="mr-2"
                />
                {t('categoryManagement.income')}
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              disabled={loading}
            >
              {t('quickCreate.cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              disabled={loading}
            >
              {loading ? t('quickCreate.creating') : t('quickCreate.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
