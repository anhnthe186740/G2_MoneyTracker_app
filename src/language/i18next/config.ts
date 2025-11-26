import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import commonVN from '../vn/common.json';
import commonEN from '../en/common.json';
import settingsVN from '../vn/settings.json';
import settingsEN from '../en/settings.json';
import dashboardVN from '../vn/dashboard.json';
import dashboardEN from '../en/dashboard.json';
import loginVN from '../vn/login.json';
import loginEN from '../en/login.json';
import registerVN from '../vn/register.json';
import registerEN from '../en/register.json';
import transactionsVN from '../vn/transactions.json';
import transactionsEN from '../en/transactions.json';
import accountsVN from '../vn/accounts.json';
import accountsEN from '../en/accounts.json';
import budgetVN from '../vn/budget.json';
import budgetEN from '../en/budget.json';
import profileVN from '../vn/profile.json';
import profileEN from '../en/profile.json';
import sidebarVN from '../vn/sidebar.json';
import sidebarEN from '../en/sidebar.json';
import goalsVN from '../vn/goals.json';
import goalsEN from '../en/goals.json';
import recurringVN from '../vn/recurring.json';
import recurringEN from '../en/recurring.json';
import analyticsVN from '../vn/analytics.json';
import analyticsEN from '../en/analytics.json';
import notificationsVN from '../vn/notifications.json';
import notificationsEN from '../en/notifications.json';
import exportVN from '../vn/export.json';
import exportEN from '../en/export.json';
import landingPageVN from '../vn/landingPage.json';
import landingPageEN from '../en/landingPage.json';

const resources = {
  vi: {
    common: commonVN,
    settings: settingsVN,
    dashboard: dashboardVN,
    login: loginVN,
    register: registerVN,
    transactions: transactionsVN,
    accounts: accountsVN,
    budget: budgetVN,
    profile: profileVN,
    sidebar: sidebarVN,
    goals: goalsVN,
    recurring: recurringVN,
    analytics: analyticsVN,
    notifications: notificationsVN,
    export: exportVN,
    landingPage: landingPageVN,
  },
  en: {
    common: commonEN,
    settings: settingsEN,
    dashboard: dashboardEN,
    login: loginEN,
    register: registerEN,
    transactions: transactionsEN,
    accounts: accountsEN,
    budget: budgetEN,
    profile: profileEN,
    sidebar: sidebarEN,
    goals: goalsEN,
    recurring: recurringEN,
    analytics: analyticsEN,
    notifications: notificationsEN,
    export: exportEN,
    landingPage: landingPageEN,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'vi',
    defaultNS: 'common',
    ns: [
      'common',
      'settings',
      'dashboard',
      'login',
      'register',
      'transactions',
      'accounts',
      'budget',
      'profile',
      'sidebar',
      'goals',
      'recurring',
      'analytics',
      'notifications',
      'export',
      'landingPage',
    ],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;

