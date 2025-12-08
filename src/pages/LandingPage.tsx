// src/pages/LandingPage.tsx
import { ChevronRight, PieChart, TrendingUp, Target, BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';

interface LandingPageProps {
  onNavigate?: (screen: string, mode?: string) => void;
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  const { t } = useTranslation('landingPage');
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
      title: t('features.tracking.title'),
      description: t('features.tracking.description')
    },
    {
      icon: <Target className="w-12 h-12 text-green-600" />,
      title: t('features.goals.title'),
      description: t('features.goals.description')
    },
    {
      icon: <BarChart3 className="w-12 h-12 text-purple-600" />,
      title: t('features.reports.title'),
      description: t('features.reports.description')
    },
    {
      icon: <TrendingUp className="w-12 h-12 text-orange-600" />,
      title: t('features.budget.title'),
      description: t('features.budget.description')
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
      <header className="container mx-auto px-6 py-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <PieChart className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl text-blue-900 dark:text-blue-200">MoneyTracker</span>
          </div>
          
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => handleNavigate('login', 'login')} 
            >
              {t('nav.login')}
            </Button>
            <Button onClick={() => handleNavigate('login', 'register')}>
              {t('nav.register')}
            </Button>
          </div>
        </div>
      </header>

      <section className="container mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl text-blue-900 dark:text-white mb-6">
          {t('hero.title')}
        </h1>
        
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
          {t('hero.subtitle')}
        </p>
        <div className="flex justify-center">
        <Button 
          size="lg" 
          onClick={() => handleNavigate('login', 'register')} 
        >
          {t('hero.cta')}
          <ChevronRight className="ml-2 w-5 h-5" /> 
        </Button>
        </div>
      </section>

      <section className="container mx-auto px-6 py-16">
        <h2 className="text-3xl text-center text-gray-800 dark:text-white mb-12">
          {t('features.title')}
        </h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-slate-800" 
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-gray-800 dark:text-foreground mb-2">{feature.title}</h3>
              <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="container mx-auto px-6 py-8 text-center text-gray-600 dark:text-gray-400">
        <p>© 2025 MoneyTracker. Quản lý tài chính cá nhân thông minh của G2-FA team.</p>
      </footer>
    </div>
  );
}

