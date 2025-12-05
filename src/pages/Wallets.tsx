import { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/Select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/Dialog';
import { Plus, Edit2, Trash2, Wallet, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

interface Wallet {
  id: number | string;
  user_id: number | string;
  name: string;
  type: 'BANK' | 'E_WALLET' | 'CASH' | 'CREDIT';
  balance: number;
  color?: string;
  note?: string;
  created_at: string;
}

export default function Wallets() {
  const { t } = useTranslation('accounts');
  const auth = useContext(AuthContext);
  const user = auth?.user;
  
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  
  // Tải trạng thái hiển thị số dư từ localStorage
  const [showBalance, setShowBalance] = useState(() => {
    const saved = localStorage.getItem('showBalance');
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  // Tải danh sách ví bị ẩn từ localStorage
  const [hiddenWallets, setHiddenWallets] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('hiddenWallets');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [formData, setFormData] = useState({
    name: '',
    type: 'CASH' as 'BANK' | 'E_WALLET' | 'CASH' | 'CREDIT',
    balance: '',
    color: '#3498db',
    note: ''
  });

  const getAccountTypeLabel = (type: string) => {
    const typeKey = `types.${type}` as const;
    return t(typeKey);
  };

  useEffect(() => {
    const loadWallets = async () => {
      try {
        setLoading(true);
        console.log('User hiện tại:', user);
        const { data } = await api.get<Wallet[]>('/wallets');
        console.log('Đã tải ví từ API:', data);
        console.log('Kiểu dữ liệu:', typeof data, 'Là mảng:', Array.isArray(data));
     
        if (user?.id && Array.isArray(data)) {
          const filtered = data.filter(w => {
            console.log(`So sánh wallet user_id ${w.user_id} (${typeof w.user_id}) với user.id ${user.id} (${typeof user.id})`);
            return String(w.user_id) === String(user.id);
          });
          console.log('Ví đã lọc cho user:', filtered);
          setWallets(filtered);
        } else {
          console.log('Không có user hoặc data không phải mảng, hiển thị tất cả ví');
          setWallets(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Lỗi khi tải ví:', error);
        toast.error(t('toast.loadError'));
        setWallets([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadWallets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedName = formData.name.trim().toLowerCase();
    const isDuplicate = wallets.some(w => {
      // Nếu đang edit, bỏ qua ví hiện tại
      if (editingWallet && w.id === editingWallet.id) return false;
      // Trùng khi: cùng tên VÀ cùng loại
      return w.name.trim().toLowerCase() === trimmedName && w.type === formData.type;
    });
    
    if (isDuplicate) {
      toast.error(t('toast.duplicateError'));
      return;
    }
    
    try {
      if (editingWallet) {
        const payload = {
          ...editingWallet,
          name: formData.name,
          type: formData.type,
          balance: parseFloat(formData.balance),
          color: formData.color,
          note: formData.note
        };
        const { data } = await api.put<Wallet>(`/wallets/${editingWallet.id}`, payload);
        setWallets(prev => prev.map(w => w.id === editingWallet.id ? data : w));
        toast.success(t('toast.updateSuccess'));
      } else {
       
        const now = new Date();
        const newWalletId = [
          now.getDate().toString().padStart(2, '0'),
          (now.getMonth() + 1).toString().padStart(2, '0'),
          now.getFullYear(),
          now.getHours().toString().padStart(2, '0'),
          now.getMinutes().toString().padStart(2, '0'),
          now.getSeconds().toString().padStart(2, '0'),
          now.getMilliseconds().toString().padStart(3, '0')
        ].join('');
        
        const payload = {
          id: newWalletId,
          name: formData.name,
          type: formData.type,
          balance: parseFloat(formData.balance),
          color: formData.color,
          note: formData.note,
          created_at: new Date().toISOString(),
          user_id: user?.id ? String(user.id) : ''
        };
        
        const { data } = await api.post<Wallet>('/wallets', payload);
        setWallets(prev => [...prev, data]);
        toast.success(t('toast.addSuccess'));
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Lỗi khi lưu ví:', error);
      toast.error(t('toast.saveError'));
    }
  };

  const handleEdit = (wallet: Wallet) => {
    setEditingWallet(wallet);
    setFormData({
      name: wallet.name,
      type: wallet.type,
      balance: String(wallet.balance),
      color: wallet.color || '#3498db',
      note: wallet.note || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number | string) => {
    if (window.confirm(t('confirm.delete'))) {
      try {
        await api.delete(`/wallets/${id}`);
        setWallets(prev => prev.filter(w => w.id !== id));
        toast.success(t('toast.deleteSuccess'));
      } catch (error) {
        console.error('Error deleting wallet:', error);
        toast.error(t('toast.deleteError'));
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'CASH',
      balance: '',
      color: '#3498db',
      note: ''
    });
    setEditingWallet(null);
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} ${t('currency')}`;
  };

  const totalBalance = wallets.reduce((sum, wallet) => sum + (wallet.balance || 0), 0);

  const getWalletIcon = () => {
    return <Wallet className="w-6 h-6" />;
  };

  const getWalletTypeLabel = (type: string) => {
    return getAccountTypeLabel(type);
  };

  const toggleWalletVisibility = (walletId: number | string) => {
    setHiddenWallets(prev => {
      const newSet = new Set(prev);
      const idStr = String(walletId);
      if (newSet.has(idStr)) {
        newSet.delete(idStr);
      } else {
        newSet.add(idStr);
      }
     
      localStorage.setItem('hiddenWallets', JSON.stringify(Array.from(newSet)));
      return newSet;
    });
  };

 
  const handleToggleShowBalance = () => {
    const newValue = !showBalance;
    setShowBalance(newValue);
    localStorage.setItem('showBalance', JSON.stringify(newValue));
  };

  if (loading) {
    return (
      <section className="space-y-6">
        <div className="flex justify-center items-center min-h-[400px]">
          <p className="text-muted-foreground">{t('loading')}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Button onClick={() => {
          resetForm();
          setIsDialogOpen(true);
        }}>
          <Plus className="w-4 h-4 mr-2" />
          {t('actions.addWallet')}
        </Button>
      </header>

      <Dialog 
        open={isDialogOpen} 
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent 
          className="w-[480px] p-5"
          onClose={() => {
            setIsDialogOpen(false);
            resetForm();
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {editingWallet ? t('dialog.editTitle') : t('dialog.addTitle')}
            </DialogTitle>
            <DialogDescription>
              {editingWallet ? t('dialog.editDescription') : t('dialog.addDescription')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '12px' }}>
            <div>
              <Label htmlFor="name">{t('form.name')}</Label>
              <Input
                id="name"
                placeholder={t('form.namePlaceholder')}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="type">{t('form.type')}</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value) => setFormData({ ...formData, type: value as typeof formData.type })}
              >
                <SelectTrigger>
                  <SelectValue>
                    {getAccountTypeLabel(formData.type) || t('form.selectType')}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(['CASH', 'BANK', 'E_WALLET', 'CREDIT'] as const).map(type => (
                    <SelectItem key={type} value={type}>
                      {getAccountTypeLabel(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="balance">{t('form.balance')}</Label>
              <Input
                id="balance"
                type="number"
                placeholder="0"
                value={formData.balance}
                onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="color">{t('form.color')}</Label>
              <div className="flex gap-3 items-center">
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-20 h-10 cursor-pointer"
                />
                <span className="text-sm text-gray-500">{formData.color}</span>
              </div>
            </div>
            
            <div>
              <Label htmlFor="note">{t('form.note')}</Label>
              <Input
                id="note"
                placeholder={t('form.notePlaceholder')}
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px' }}>
              <Button type="submit" style={{ flex: 1, background: '#2563eb', color: '#fff', padding: '10px 24px' }}>
                {t('form.save')}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                style={{ minWidth: 60, padding: '10px 16px' }}
                onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
              >
                {t('form.cancel')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Total Balance */}
      <Card className="p-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <p className="text-lg opacity-90 mb-2">
          {t('totalBalance')} ({wallets.length} {t('walletCount')})
        </p>
        <div className="flex items-center gap-3">
          <p className="text-4xl font-bold">
            {showBalance ? formatCurrency(totalBalance) : '••••••••'}
          </p>
          <button
            onClick={handleToggleShowBalance}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
            aria-label={showBalance ? 'Ẩn số dư' : 'Hiện số dư'}
          >
            {showBalance ? (
              <Eye className="w-6 h-6" />
            ) : (
              <EyeOff className="w-6 h-6" />
            )}
          </button>
        </div>
      </Card>

      {/* Wallet List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {wallets.length === 0 ? (
          <div className="col-span-full">
            <Card className="p-12">
              <p className="text-muted-foreground text-center">{t('empty.title')}</p>
            </Card>
          </div>
        ) : (
          wallets.map((wallet) => (
            <Card key={wallet.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  {getWalletIcon()}
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(wallet)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(wallet.id)}>
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
              
              <h3 className="text-xl font-semibold text-foreground mb-1">{wallet.name}</h3>
              <p className="text-muted-foreground mb-4">
                {getWalletTypeLabel(wallet.type)}
              </p>
              
              <div className="flex items-center gap-2 mb-2">
                <p className="text-2xl font-bold" style={{ color: wallet.color || '#3498db' }}>
                  {!hiddenWallets.has(String(wallet.id)) ? formatCurrency(wallet.balance || 0) : '••••••••'}
                </p>
                <button
                  onClick={() => toggleWalletVisibility(wallet.id)}
                  className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label={hiddenWallets.has(String(wallet.id)) ? 'Hiện số dư' : 'Ẩn số dư'}
                >
                  {!hiddenWallets.has(String(wallet.id)) ? (
                    <Eye className="w-5 h-5 text-gray-500" />
                  ) : (
                    <EyeOff className="w-5 h-5 text-gray-500" />
                  )}
                </button>
              </div>
              
              {wallet.note && wallet.note.trim() !== '' && (
                <p className="text-sm text-muted-foreground mt-3 pt-3 border-t border-border">
                  {wallet.note}
                </p>
              )}
            </Card>
          ))
        )}
      </div>
    </section>
  );
}

