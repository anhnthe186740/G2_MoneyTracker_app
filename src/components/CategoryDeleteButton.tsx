import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import api from '../services/api';
import type { Category } from '../types';

interface CategoryDeleteButtonProps {
    category: Category;
    onDeleted: () => void;
}

const CategoryDeleteButton: React.FC<CategoryDeleteButtonProps> = ({ category, onDeleted }) => {
    const [showConfirm, setShowConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState('');

    const handleDelete = async () => {
        setIsDeleting(true);
        setError('');

        try {
            // Xóa danh mục
            await api.delete(`/categories/${category.id}`);
            setShowConfirm(false);
            onDeleted();
        } catch (err) {
            console.error('Error deleting category:', err);
            setError('Có lỗi xảy ra khi xóa danh mục');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setShowConfirm(true)}
                className="p-2 text-red-600 hover:bg-red-50 rounded"
                title="Xóa danh mục"
            >
                <Trash2 size={18} />
            </button>

            {showConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold mb-4">Xác nhận xóa danh mục</h3>
                        <p className="text-gray-600 mb-4">
                            Bạn có chắc chắn muốn xóa danh mục <strong>{category.name}</strong>?
                        </p>
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
                                {error}
                            </div>
                        )}
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => {
                                    setShowConfirm(false);
                                    setError('');
                                }}
                                className="px-4 py-2 border rounded hover:bg-gray-50"
                                disabled={isDeleting}
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                                disabled={isDeleting}
                            >
                                {isDeleting ? 'Đang xóa...' : 'Xóa'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default CategoryDeleteButton;
