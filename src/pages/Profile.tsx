import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { type User } from '../types';

export default function Profile() {
  const { user, setUser } = useContext(AuthContext)!;
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'info' | 'password'>('info');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isLoading, setIsLoading] = useState(false);

  const [preview, setPreview] = useState<string>("");

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    avatar: '',
    currency: '',
    createdAt: ''
  });

  const [passData, setPassData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        avatar: user.avatar || '',
        currency: user.currency || 'VND',
        createdAt: user.createdAt || ''
      });
      setPreview(user.avatar || "");
    }
  }, [user]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setPreview(url);
    setFormData({ ...formData, avatar: url });
  };

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setMessage({ text: '', type: '' });

    if (!formData.fullName.trim()) {
      setMessage({ text: 'Họ và tên không được để trống!', type: 'error' });
      return;
    }

    setIsLoading(true);

    if (!formData.fullName.trim()) {
      setMessage({ text: 'Họ và tên không được để trống!', type: 'error' });
      setIsLoading(false);
      return;
    }

    if (!formData.email.trim()) {
      setMessage({ text: 'Email không được để trống!', type: 'error' });
      setIsLoading(false);
      return;
    }

    if (!formData.email.includes('@')) {
      setMessage({ text: 'Email phải chứa ký tự @', type: 'error' });
      setIsLoading(false);
      return;
    }

    try {
      const payload = {
        fullName: formData.fullName,
        email: formData.email,
        avatar: preview || user.avatar
      };

      await api.patch(`/users/${user.id}`, payload);

      const res = await api.get(`/users/${user.id}`);
      const fullUser = res.data;

      localStorage.setItem('user', JSON.stringify(fullUser));

      setUser(fullUser);

      setMessage({ text: 'Cập nhật thông tin thành công!', type: 'success' });
    } catch (error) {
      console.error(error);
      setMessage({ text: 'Lỗi khi cập nhật thông tin.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setMessage({ text: '', type: '' });

    if (passData.newPassword !== passData.confirmPassword) {
      setMessage({ text: 'Mật khẩu xác nhận không khớp!', type: 'error' });
      return;
    }

    if (user.password && passData.currentPassword !== user.password) {
      setMessage({ text: 'Mật khẩu hiện tại không đúng!', type: 'error' });
      return;
    }

    setIsLoading(true);

    try {
      const payload = { password: passData.newPassword };

      await api.patch(`/users/${user.id}`, payload);

      const res = await api.get(`/users/${user.id}`);
      const fullUser = res.data;

      localStorage.setItem('user', JSON.stringify(fullUser));
      setUser(fullUser);

      setMessage({ text: 'Đổi mật khẩu thành công!', type: 'success' });

      setPassData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error(error);
      setMessage({ text: 'Lỗi server.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex justify-center">
      <div className="w-full max-w-2xl">
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-500 hover:text-indigo-600 font-medium transition mr-4"
          >
            Quay lại
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Hồ sơ người dùng</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-indigo-600 p-8 text-white flex items-center gap-6">
            <label className="relative cursor-pointer">
              <img
                src={preview || "/default-avatar.png"}
                className="w-20 h-20 rounded-full border-4 border-indigo-200 object-cover"
              />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              <div className="absolute bottom-0 right-0 bg-white text-indigo-600 px-2 py-1 text-xs rounded shadow">
                Đổi
              </div>
            </label>

            <div>
              <h2 className="text-2xl font-bold">{formData.fullName}</h2>
              <p className="opacity-80">@{user?.username}</p>
              <div className="mt-2 text-xs bg-indigo-700 inline-block px-2 py-1 rounded">
                Thành viên từ: {user?.createdAt ? new Date(user.createdAt).getFullYear() : '2024'}
              </div>
            </div>
          </div>

          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('info')}
              className={`flex-1 py-4 text-center font-medium transition ${activeTab === 'info' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              📝 Thông tin tài khoản
            </button>

            <button
              onClick={() => setActiveTab('password')}
              className={`flex-1 py-4 text-center font-medium transition ${activeTab === 'password' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              🔒 Đổi mật khẩu
            </button>
          </div>

          {message.text && (
            <div className={`mx-8 mt-6 p-4 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {message.text}
            </div>
          )}

          <div className="p-8">
            {activeTab === 'info' ? (
              <form onSubmit={handleUpdateInfo} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Họ và tên</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                  <input
                    type="text"
                    value={user?.username}
                    disabled
                    className="w-full px-4 py-3 border border-gray-200 bg-gray-100 text-gray-600 rounded-xl cursor-not-allowed"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tiền tệ</label>
                    <input
                      type="text"
                      value={formData.currency}
                      disabled
                      className="w-full px-4 py-3 border border-gray-200 bg-gray-100 text-gray-600 rounded-xl cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ngày tạo</label>
                    <input
                      type="text"
                      value={formatDate(formData.createdAt)}
                      disabled
                      className="w-full px-4 py-3 border border-gray-200 bg-gray-100 text-gray-600 rounded-xl cursor-not-allowed"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition shadow-md mt-4"
                >
                  {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu hiện tại</label>
                  <input
                    type="password"
                    required
                    value={passData.currentPassword}
                    onChange={(e) => setPassData({ ...passData, currentPassword: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu mới</label>
                  <input
                    type="password"
                    required
                    value={passData.newPassword}
                    onChange={(e) => setPassData({ ...passData, newPassword: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Xác nhận mật khẩu mới</label>
                  <input
                    type="password"
                    required
                    value={passData.confirmPassword}
                    onChange={(e) => setPassData({ ...passData, confirmPassword: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition shadow-md mt-4"
                >
                  {isLoading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
