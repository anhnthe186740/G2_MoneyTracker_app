import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Receipt } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);

  if (!authContext || !authContext.user) {
    return <div>Vui lòng đăng nhập</div>;
  }

  const { user } = authContext;

  const features = [
    {
      title: 'Quản lý giao dịch',
      description: 'Theo dõi thu chi, xem biểu đồ và quản lý giao dịch định kỳ',
      icon: Receipt,
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
      path: '/transactions',
    },
  ];

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
      </header>
      <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-muted-foreground">
        bổ sung các tính năng.
      </div>
    </section>
  );
}
