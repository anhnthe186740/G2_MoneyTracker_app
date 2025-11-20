import { createContext, useState, useEffect, type ReactNode } from 'react';
import api from '../services/api';
import { type User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (identifier: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) setUser(JSON.parse(saved));
    setLoading(false);
  }, []);

  const login = async (identifier: string, password: string) => {
    try {
      const res = await api.get<User[]>('/users');
      const foundUser = res.data.find(u => 
        (u.username === identifier || u.email === identifier) && u.password === password
      );

      if (foundUser) {
        // XÓA password TRƯỚC KHI LƯU → vẫn bảo mật cơ bản
        const { password, ...safeUser } = foundUser;
        localStorage.setItem('user', JSON.stringify(safeUser));
        setUser(safeUser as User);
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};