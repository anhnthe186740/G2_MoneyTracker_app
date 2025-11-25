// src/pages/LandingPage.tsx
import { ChevronRight, PieChart, TrendingUp, Target, BarChart3 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';

interface LandingPageProps {
  onNavigate?: (screen: string, mode?: string) => void;
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  const navigate = useNavigate();

  // Hàm xử lý navigation
  const handleNavigate = (screen: string, mode?: string) => {
    if (onNavigate) {
      onNavigate(screen, mode);
    } else {
      // Default navigation với React Router
      if (screen === 'login') {
        if (mode === 'register') {
          navigate('/register');
        } else {
          navigate('/login');
        }
      } else {
        navigate(`/${screen}`);
      }
    }
  };

  const features = [
    {
      icon: <PieChart className="w-12 h-12 text-blue-600" />,
      title: 'Quản lý chi tiêu, thu nhập',
      description: 'Theo dõi mọi khoản thu chi một cách dễ dàng và trực quan'
    },
    {
      icon: <Target className="w-12 h-12 text-green-600" />,
      title: 'Mục tiêu tài chính',
      description: 'Đặt và theo dõi các mục tiêu tiết kiệm của bạn'
    },
    {
      icon: <BarChart3 className="w-12 h-12 text-purple-600" />,
      title: 'Biểu đồ phân tích',
      description: 'Phân tích chi tiêu theo thời gian với biểu đồ trực quan'
    },
    {
      icon: <TrendingUp className="w-12 h-12 text-orange-600" />,
      title: 'Báo cáo chi tiết',
      description: 'Xuất báo cáo dễ dàng, hỗ trợ đa nền tảng'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <header className="container mx-auto px-6 py-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <PieChart className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl text-blue-900">MoneyMaster</span>
          </div>
          
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => handleNavigate('login', 'login')} 
            >
              Đăng nhập
            </Button>
            <Button onClick={() => handleNavigate('login', 'register')}>
              Đăng ký ngay
            </Button>
          </div>
        </div>
      </header>

      <section className="container mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl text-blue-900 mb-6">
          Quản lý chi tiêu thông minh
        </h1>
        
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Làm chủ tài chính của bạn - Theo dõi thu chi, lập ngân sách và đạt được mục tiêu tài chính dễ dàng
        </p>
        <div className="flex justify-center">
        <Button 
          size="lg" 
          onClick={() => handleNavigate('login', 'register')} 
        >
          Bắt đầu miễn phí
          <ChevronRight className="ml-2 w-5 h-5" /> 
        </Button>
        </div>
      </section>

      <section className="container mx-auto px-6 py-16">
        <h2 className="text-3xl text-center text-gray-800 mb-12">
          Tính năng nổi bật
        </h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow" 
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-gray-800 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="container mx-auto px-6 py-8 text-center text-gray-600">
        <p>© 2025 MoneyMaster. Quản lý tài chính cá nhân thông minh của G2-FA team.</p>
      </footer>
    </div>
  );
}

