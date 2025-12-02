import { createContext, useState, type ReactNode, type Dispatch, type SetStateAction } from 'react';
import api from '../services/api';
import { type User } from '../types';

interface AuthContextType {
  user: User | null;
  setUser: Dispatch<SetStateAction<User | null>>; 
  login: (identifier: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

// FIX LỖI 1: Thêm dòng này để tắt cảnh báo Fast Refresh cho Context export
// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // FIX LỖI 2: Lazy Initialization (Chuyển logic đọc localStorage vào đây)
  // Việc này giúp bỏ useEffect, tránh re-render thừa và sửa lỗi "set-state-in-effect"
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error("Lỗi parsing user từ localStorage", e);
      localStorage.removeItem('user');
      return null;
    }
  });

  // Vì lấy dữ liệu từ localStorage là đồng bộ, loading ban đầu là false luôn
  const [loading, setLoading] = useState(false);

  const login = async (identifier: string, password: string) => {
    try {
      setLoading(true); // Có thể thêm loading state khi đang call API
      const res = await api.get<User[]>('/users');
      
      const foundUser = res.data.find(u => 
        (u.username === identifier || u.email === identifier) && u.password === password
      );

      if (foundUser) {
        // FIX LỖI 3: Thêm comment ignore dòng destructuring password không dùng tới
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _unused, ...safeUser } = foundUser;
        
        localStorage.setItem('user', JSON.stringify(safeUser));
        setUser(safeUser as User);
        setLoading(false);
        return true;
      }
      setLoading(false);
      return false;
    } catch (err) {
      console.error(err);
      setLoading(false);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };


  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth phải được dùng trong AuthProvider");
  }
  return context;
};

