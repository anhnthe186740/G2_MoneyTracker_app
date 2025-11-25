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
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Chào mừng, {user.fullName}!</h1>
          <p className="text-gray-600 mt-2">Chọn chức năng bạn muốn sử dụng</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <button
                key={feature.path}
                onClick={() => navigate(feature.path)}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-all transform hover:-translate-y-1"
              >
                <div className={`${feature.color} w-16 h-16 rounded-full flex items-center justify-center mb-4`}>
                  <Icon size={32} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </button>
            );
          })}
        </div>


      </div>
    </div>
  );
}