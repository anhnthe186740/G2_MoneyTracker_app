import axios from "axios";
import { Wallet, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

interface WalletType {
  id: string;
  user_id: number;
  name: string;
  balance: number;
  color: string;
}

export default function Dashboard() {
  const [wallets, setWallets] = useState<WalletType[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchWallets = async () => {
      try {
        const response = await axios.get("http://localhost:3001/wallets");
        setWallets(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Lỗi khi lấy ví:", err);
        setLoading(false);
      }
    };

    fetchWallets();
  }, []);

  const { user } = useAuth();

  if (!user) {
    return (
      <section className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-2xl font-semibold text-muted-foreground">
            Vui lòng đăng nhập để xem thông tin tài chính
          </p>
        </div>
      </section>
    );
  }
  const currentUserId = Number(user.id);

  const myWallets = wallets.filter((wallet) => wallet.user_id === currentUserId);

  const totalBalance = myWallets.reduce((sum, wallet) => sum + wallet.balance, 0);

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-foreground">Tổng quan tài chính</h1>
        <p className="text-muted-foreground">!</p>
      </header>

      <div className="rounded-2xl border bg-card shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-8 text-white">
          <div className="flex items-center gap-3 mb-4">
            <Wallet className="h-8 w-8" />
            <h2 className="text-2xl font-bold">Tổng số dư tài khoản</h2>
          </div>

          {loading ? (
            <div className="flex items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="text-lg">Đang tải số dư...</span>
            </div>
          ) : (
            <div className="text-4xl font-extrabold tracking-tight">
              {totalBalance.toLocaleString("vi-VN")} đ
            </div>
          )}

          <p className="text-sm opacity-90 mt-3">
            {myWallets.length} ví • Cập nhật vừa xong
          </p>
        </div>

        <div className="p-6 bg-muted/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myWallets.map((wallet) => (
              <div
                key={wallet.id}
                className="flex items-center justify-between p-4 rounded-xl bg-white border shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-12 rounded-full"
                    style={{ backgroundColor: wallet.color }}
                  />
                  <div>
                    <p className="font-medium">{wallet.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {wallet.balance.toLocaleString("vi-VN")} ₫
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}