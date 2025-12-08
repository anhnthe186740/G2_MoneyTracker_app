import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
// import ICU from 'i18next-icu'; // Temporarily disabled to fix interpolation
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
import walletsVN from '../vn/wallets.json';
import walletsEN from '../en/wallets.json';
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
    wallets: walletsVN,
    budget: budgetVN,
    profile: profileVN,
    sidebar: sidebarVN,
    goals: goalsVN,
    recurring: recurringVN,
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
    wallets: walletsEN,
    budget: budgetEN,
    profile: profileEN,
    sidebar: sidebarEN,
    goals: goalsEN,
    recurring: recurringEN,
    notifications: notificationsEN,
    export: exportEN,
    landingPage: landingPageEN,
  },
};

i18n
  // .use(ICU) // Temporarily disabled to fix interpolation
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
      'wallets',
      'budget',
      'profile',
      'sidebar',
      'goals',
      'recurring',
      'notifications',
      'export',
      'landingPage',
    ],
    interpolation: {
      escapeValue: false,
      prefix: '{{',
      suffix: '}}',
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;

