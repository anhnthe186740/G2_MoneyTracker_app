import React, { useState, useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { User as UserIcon, Mail, Lock, CheckCircle } from 'lucide-react';

export default function Profile() {
  const { t } = useTranslation('profile');
  const { user, setUser } = useContext(AuthContext)!;

  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isLoading, setIsLoading] = useState(false);

  const [preview, setPreview] = useState<string>("");

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    avatar: '',
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
      });
      setPreview(user.avatar || "");
    }
  }, [user]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(undefined, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setPreview(base64String);
      setFormData({ ...formData, avatar: base64String });
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setMessage({ text: '', type: '' });

    if (!formData.fullName.trim()) {
      setMessage({ text: t('validation.nameRequired'), type: 'error' });
      return;
    }

    if (!formData.email.trim()) {
      setMessage({ text: t('validation.emailRequired'), type: 'error' });
      return;
    }

    if (!formData.email.includes('@')) {
      setMessage({ text: t('validation.emailInvalid'), type: 'error' });
      return;
    }

    setIsLoading(true);

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

      setMessage({ text: t('messages.updateSuccess'), type: 'success' });
      setIsEditingInfo(false);
    } catch (error) {
      console.error(error);
      setMessage({ text: t('messages.updateError'), type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setMessage({ text: '', type: '' });

    if (passData.newPassword !== passData.confirmPassword) {
      setMessage({ text: t('validation.passwordMismatch'), type: 'error' });
      return;
    }

    if (user.password && passData.currentPassword !== user.password) {
      setMessage({ text: t('validation.passwordIncorrect'), type: 'error' });
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

      setMessage({ text: t('messages.passwordSuccess'), type: 'success' });

      setPassData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setIsChangingPassword(false);
    } catch (error) {
      console.error(error);
      setMessage({ text: t('messages.serverError'), type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
        <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}



      {/* Account Information Section */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">{t('accountInfo.title')}</h3>
          {!isEditingInfo && (
            <button
              onClick={() => setIsEditingInfo(true)}
              className="px-4 py-2 bg-foreground text-background rounded-lg hover:opacity-90 transition text-sm font-medium"
            >
              {t('accountInfo.edit')}
            </button>
          )}
        </div>

        <div className="p-6">
          <div className="flex items-center gap-6 mb-8 border-b border-border pb-6">
            <label className={`relative ${isEditingInfo ? 'cursor-pointer group' : ''}`}>
              <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
                {preview ? (
                  <img src={preview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-10 h-10" />
                )}
              </div>
              {isEditingInfo && (
                <>
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  <div className="absolute bottom-0 right-0 bg-blue-600 text-white p-1.5 rounded-full shadow-lg group-hover:bg-blue-700 transition">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                </>
              )}
            </label>

            <div className="flex-1">
              <h2 className="text-2xl font-bold text-foreground">{user?.fullName || t('user')}</h2>
              <p className="text-muted-foreground">{user?.email}</p>
              {isEditingInfo && (
                <div className="mt-2 inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                  <CheckCircle className="w-3 h-3" />
                  {t('changeAvatar')}
                </div>
              )}
            </div>
          </div>

          {isEditingInfo ? (
            <form onSubmit={handleUpdateInfo} className="space-y-4">
              <div className="flex items-start gap-3">
                <UserIcon className="w-5 h-5 text-muted-foreground mt-3" />
                <div className="flex-1">
                  <label className="block text-sm text-muted-foreground mb-1">{t('accountInfo.fullName')}</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-background text-foreground"
                  />
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-muted-foreground mt-3" />
                <div className="flex-1">
                  <label className="block text-sm text-muted-foreground mb-1">{t('accountInfo.email')}</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-background text-foreground"
                  />
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-muted-foreground mt-3" />
                <div className="flex-1">
                  <label className="block text-sm text-muted-foreground mb-1">{t('accountInfo.password')}</label>
                  <div className="text-foreground">••••••••</div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-foreground text-background py-2 rounded-lg hover:opacity-90 transition font-medium"
                >
                  {isLoading ? t('accountInfo.saving') : t('accountInfo.save')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingInfo(false);
                    setFormData({
                      fullName: user?.fullName || '',
                      email: user?.email || '',
                      avatar: user?.avatar || '',
                    });
                  }}
                  className="px-6 py-2 border border-border rounded-lg hover:bg-accent transition"
                >
                  {t('accountInfo.cancel')}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <UserIcon className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="text-sm text-muted-foreground">{t('accountInfo.fullName')}</div>
                  <div className="text-foreground font-medium">{user?.fullName}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="text-sm text-muted-foreground">{t('accountInfo.email')}</div>
                  <div className="text-foreground font-medium">{user?.email}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="text-sm text-muted-foreground">{t('accountInfo.password')}</div>
                  <div className="text-foreground font-medium">••••••••</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Security Section */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">{t('security.title')}</h3>
          {!isChangingPassword && (
            <button
              onClick={() => setIsChangingPassword(true)}
              className="px-4 py-2 border border-border rounded-lg hover:bg-accent transition text-sm font-medium"
            >
              {t('security.changePassword')}
            </button>
          )}
        </div>

        <div className="p-6">
          {isChangingPassword ? (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">{t('security.currentPassword')}</label>
                <input
                  type="password"
                  required
                  value={passData.currentPassword}
                  onChange={(e) => setPassData({ ...passData, currentPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-background text-foreground"
                />
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-1">{t('security.newPassword')}</label>
                <input
                  type="password"
                  required
                  value={passData.newPassword}
                  onChange={(e) => setPassData({ ...passData, newPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-background text-foreground"
                />
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-1">{t('security.confirmPassword')}</label>
                <input
                  type="password"
                  required
                  value={passData.confirmPassword}
                  onChange={(e) => setPassData({ ...passData, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-background text-foreground"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-foreground text-background py-2 rounded-lg hover:opacity-90 transition font-medium"
                >
                  {isLoading ? t('security.processing') : t('security.changePassword')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsChangingPassword(false);
                    setPassData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    });
                  }}
                  className="px-6 py-2 border border-border rounded-lg hover:bg-accent transition"
                >
                  {t('accountInfo.cancel')}
                </button>
              </div>
            </form>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t('security.description')}
            </p>
          )}
        </div>
      </div>

      {/* Account Details Section */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">{t('details.title')}</h3>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between py-2">
            <span className="text-muted-foreground">{t('details.createdAt')}</span>
            <span className="text-foreground font-medium">{formatDate(user?.createdAt || '')}</span>
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-muted-foreground">{t('details.loginStatus')}</span>
            <span className="inline-flex items-center gap-1 text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
              <CheckCircle className="w-4 h-4" />
              {t('details.loggedIn')}
            </span>
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-muted-foreground">{t('details.loginMethod')}</span>
            <span className="text-foreground font-medium">{t('details.emailPassword')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
