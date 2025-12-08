
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './language/i18next/config';
import { AuthProvider } from './context/AuthContext.tsx';
import { NotificationProvider } from './context/NotificationContext.tsx';
import { Toaster } from 'sonner';
import { TransactionProvider } from './context/TransactionContext.tsx';
import { RecurringTransactionProvider } from './context/RecurringTransactionContext.tsx';
import { BudgetProvider } from './context/BudgetContext.tsx';
import { CategoryProvider } from './context/CategoryContext.tsx';

// Initialize theme from localStorage before rendering
const initializeTheme = () => {
  const saved = localStorage.getItem('app-settings');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {
      console.error('Error parsing saved settings:', e);
    }
  }
};

// Apply theme immediately
initializeTheme();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <NotificationProvider>
        <Toaster position="top-right" richColors />
        <CategoryProvider>
          <TransactionProvider>
            <RecurringTransactionProvider>
              <BudgetProvider>
                <App />
              </BudgetProvider>
            </RecurringTransactionProvider>
          </TransactionProvider>
        </CategoryProvider>
      </NotificationProvider>
    </AuthProvider>
  </React.StrictMode>
);
