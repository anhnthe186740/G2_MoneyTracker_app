
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './context/AuthContext.tsx';
import { NotificationProvider } from './context/NotificationContext.tsx';
import { Toaster } from 'sonner';
import { TransactionProvider } from './context/TransactionContext.tsx';
import { RecurringTransactionProvider } from './context/RecurringTransactionContext.tsx';
import { BudgetProvider } from './context/BudgetContext.tsx';
import { CategoryProvider } from './context/CategoryContext.tsx';

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
