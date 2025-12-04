// context/CategoryContext.tsx
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from 'react';
import api from '../services/api';
import type { Category } from '../types/index';
import { AuthContext } from './AuthContext';

interface CategoryContextType {
  categories: Category[];
  loading: boolean;
  error: string | null;
  getCategories: () => Promise<void>;
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

export const CategoryProvider = ({ children }: { children: React.ReactNode }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const auth = useContext(AuthContext);
  const user = auth?.user;

  const getCategories = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      // json-server filter đúng theo field trong db: user_id
      const response = await api.get(`/categories?user_id=${user.id}`);
      setCategories(response.data);
    } catch (error) {
      setError('Lỗi khi lấy danh mục.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      getCategories();
    }
  }, [user, getCategories]);

  return (
    <CategoryContext.Provider
      value={{
        categories,
        loading,
        error,
        getCategories,
      }}
    >
      {children}
    </CategoryContext.Provider>
  );
};

export const useCategoryContext = () => {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error('useCategoryContext must be used within a CategoryProvider');
  }
  return context;
};
