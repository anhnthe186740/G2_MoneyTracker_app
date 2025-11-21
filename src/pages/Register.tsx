// src/pages/Register.tsx
import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import api from '../services/api';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useContext(AuthContext)!;
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (password.length < 3) {
      setError('Mật khẩu phải ít nhất 3 ký tự');
      return;
    }

    setLoading(true);

    try {
      // Kiểm tra email đã tồn tại chưa
      const checkRes = await api.get(`/users?email=${email}`);
      if (checkRes.data.length > 0) {
        setError('Email này đã được sử dụng');
        setLoading(false);
        return;
      }

      // Tạo user mới (json-server tự sinh id)
      const newUser = {
        username: email.split('@')[0], // tự sinh username từ email
        email,
        password,
        fullName,
        currency: "VND",
        createdAt: new Date().toISOString()
      };

      const res = await api.post('/users', newUser);

      // Đăng nhập luôn sau khi đăng ký thành công
      const success = await login(email, password);
      if (success) {
        navigate('/dashboard');
      }
    } catch (err) {
      setError('Đã có lỗi xảy ra, vui lòng thử lại');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="bg-indigo-600 rounded-2xl p-4 shadow-lg">
            <span className="text-white text-4xl font-bold">₫</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Đăng ký tài khoản mới
          </h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Họ và tên */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Họ và tên
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                required
              />
            </div>

            {/* Mật khẩu */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                required
              />
            </div>

            {/* Xác nhận mật khẩu */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Xác nhận mật khẩu
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                required
              />
            </div>

            {/* Lỗi */}
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            {/* Nút Đăng ký */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 hover:bg-black text-white font-semibold py-4 rounded-xl transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Đang tạo tài khoản...
                </>
              ) : (
                'Đăng ký'
              )}
            </button>
          </form>

          {/* Đã có tài khoản */}
          <p className="text-center mt-8 text-gray-600">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-indigo-600 font-semibold hover:underline">
              Đăng nhập
            </Link>
          </p>

          {/* Quay lại trang chủ */}
          <div className="text-center mt-6">
            <Link to="/" className="text-gray-500 text-sm hover:text-gray-700">
              ← Quay lại trang chủ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}