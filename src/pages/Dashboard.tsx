import { Wallet } from "lucide-react";
import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Receipt } from "lucide-react";
import { AuthContext } from "../context/AuthContext";

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
        <h1 className="text-3xl font-bold text-foreground">Tổng quan tài chính</h1>
      </header>
      <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-muted-foreground">
        <div className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-background via-card to-card/50">
          <div className="bg-primary/5 border-b">
            <div className="text-xl flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Tình hình tài chính hiện tại
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
