import { useState, useEffect, useContext } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/Select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/Dialog';
import { Plus, Edit2, Trash2, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

interface Wallet {
  id: string;
  user_id: number;
  name: string;
  type: 'BANK' | 'E_WALLET' | 'CASH' | 'CREDIT';
  balance: number;
  color?: string;
  note?: string;
  created_at: string;
}

export default function Accounts() {
  const auth = useContext(AuthContext);
  const user = auth?.user;
  
  const [accounts, setAccounts] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Wallet | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'CASH' as 'BANK' | 'E_WALLET' | 'CASH' | 'CREDIT',
    balance: '',
    color: '#3498db',
    note: ''
  });

  const accountTypes = [
    { value: 'CASH', label: 'Tiền mặt' },
    { value: 'BANK', label: 'Ngân hàng' },
    { value: 'E_WALLET', label: 'Ví điện tử' },
    { value: 'CREDIT', label: 'Thẻ tín dụng' }
  ];

  // Load wallets from API
  useEffect(() => {
    const loadWallets = async () => {
      try {
        setLoading(true);
        console.log(' Current user:', user);
        const { data } = await api.get<Wallet[]>('/wallets');
        console.log(' Loaded wallets from API:', data);
        console.log('Data type:', typeof data, 'Is array:', Array.isArray(data));
        
        // Filter by user_id if user is logged in
        if (user?.id && Array.isArray(data)) {
          const filtered = data.filter(w => {
            console.log(`Comparing wallet user_id ${w.user_id} (${typeof w.user_id}) with user.id ${user.id} (${typeof user.id})`);
            return String(w.user_id) === String(user.id);
          });
          console.log(' Filtered wallets for user:', filtered);
          setAccounts(filtered);
        } else {
          console.log(' No user or data is not array, showing all wallets');
          setAccounts(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error(' Error loading wallets:', error);
        toast.error('Không thể tải danh sách tài khoản');
        setAccounts([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadWallets();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAccount) {
        // Giữ nguyên các trường quan trọng khi update
        const payload = {
          ...editingAccount, // Giữ tất cả các trường cũ
          name: formData.name,
          type: formData.type,
          balance: parseFloat(formData.balance),
          color: formData.color,
          note: formData.note
        };
        const { data } = await api.put<Wallet>(`/wallets/${editingAccount.id}`, payload);
        setAccounts(prev => prev.map(a => a.id === editingAccount.id ? data : a));
        toast.success('Cập nhật tài khoản thành công!');
      } else {
        const payload: Partial<Wallet> & { created_at: string } = {
          name: formData.name,
          type: formData.type,
          balance: parseFloat(formData.balance),
          color: formData.color,
          note: formData.note,
          created_at: new Date().toISOString()
        };
        
        if (user?.id) {
          const numId = Number(user.id);
          payload.user_id = !isNaN(numId) && String(numId) === String(user.id) ? numId : Number(user.id);
        }
        
        const { data } = await api.post<Wallet>('/wallets', payload);
        setAccounts(prev => [...prev, data]);
        toast.success('Thêm tài khoản thành công!');
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error(' Error saving wallet:', error);
      toast.error('Không thể lưu tài khoản');
    }
  };

  const handleEdit = (account: Wallet) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      type: account.type,
      balance: String(account.balance),
      color: account.color || '#3498db',
      note: account.note || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tài khoản này?')) {
      try {
        await api.delete(`/wallets/${id}`);
        setAccounts(prev => prev.filter(a => a.id !== id));
        toast.success('Xóa tài khoản thành công!');
      } catch (error) {
        console.error(' Error deleting wallet:', error);
        toast.error('Không thể xóa tài khoản');
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
    setEditingAccount(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

  const getAccountIcon = () => {
    return <Wallet className="w-6 h-6" />;
  };

  const getAccountTypeLabel = (type: string) => {
    return accountTypes.find(t => t.value === type)?.label || type;
  };

  if (loading) {
    return (
      <section className="space-y-6">
        <div className="flex justify-center items-center min-h-[400px]">
          <p className="text-muted-foreground">Đang tải dữ liệu...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Quản lý tài khoản</h1>
          <p className="text-muted-foreground">Theo dõi các tài khoản tài chính của bạn</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Thêm tài khoản
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
          className="w-[480px]"
          onClose={() => {
            setIsDialogOpen(false);
            resetForm();
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {editingAccount ? 'Chỉnh sửa tài khoản' : 'Thêm tài khoản mới'}
            </DialogTitle>
            <DialogDescription>
              {editingAccount ? 'Cập nhật thông tin tài khoản hiện tại của bạn' : 'Tạo tài khoản mới'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="px-6 pb-6 pt-0 space-y-4">
            <div>
              <Label htmlFor="name">Tên tài khoản</Label>
              <Input
                id="name"
                placeholder="VD: Ví tiền mặt"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="type">Loại tài khoản</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value) => setFormData({ ...formData, type: value as typeof formData.type })}
              >
                <SelectTrigger>
                  <SelectValue>
                    {accountTypes.find(t => t.value === formData.type)?.label || 'Chọn loại tài khoản'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {accountTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="balance">Số dư ban đầu</Label>
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
              <Label htmlFor="note">Ghi chú</Label>
              <Input
                id="note"
                placeholder="Thêm ghi chú..."
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="color">Màu sắc</Label>
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
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="flex-1">
                {editingAccount ? 'Cập nhật' : 'Thêm'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
              >
                Hủy
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Tổng số dư */}
      <Card className="p-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <p className="text-lg opacity-90 mb-2">Tổng số dư tất cả tài khoản</p>
        <p className="text-4xl font-bold">{formatCurrency(totalBalance)}</p>
      </Card>

      {/* Danh sách tài khoản */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.length === 0 ? (
          <div className="col-span-full">
            <Card className="p-12">
              <p className="text-muted-foreground text-center">Chưa có tài khoản nào. Hãy thêm tài khoản đầu tiên!</p>
            </Card>
          </div>
        ) : (
          accounts.map((account) => (
            <Card key={account.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  {getAccountIcon()}
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(account)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(account.id)}>
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
              
              <h3 className="text-xl font-semibold text-foreground mb-1">{account.name}</h3>
              <p className="text-muted-foreground mb-4">
                {getAccountTypeLabel(account.type)}
              </p>
              
              <p className="text-2xl font-bold mb-2" style={{ color: account.color || '#3498db' }}>
                {formatCurrency(account.balance || 0)}
              </p>
              
              {account.note && account.note.trim() !== '' && (
                <p className="text-sm text-muted-foreground mt-3 pt-3 border-t border-border">
                  {account.note}
                </p>
              )}
            </Card>
          ))
        )}
      </div>
    </section>
  );
}
