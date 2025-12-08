import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Check, Globe, Moon, Palette, RotateCcw, Save, Sun } from 'lucide-react';

type Theme = 'light' | 'dark';
type Language = 'vi' | 'en';
type Currency = 'VND' | 'USD';

interface NotificationSettings {
  inactivityReminders: boolean;
  recurringTransactionReminders: boolean;
  goalDeadlineReminders: boolean;
  budgetAlerts: boolean;
  lowBalanceAlerts: boolean;
  largeTransactionAlerts: boolean;
  goalProgressAlerts: boolean;
  goalCompletionAlerts: boolean;
  monthlySummaryAlerts: boolean;
}

const getInitialLanguage = (i18nLang: string): Language => {
  return i18nLang?.startsWith('vi') ? 'vi' : i18nLang?.startsWith('en') ? 'en' : 'vi';
};

const getInitialTheme = (): Theme => {
  const saved = localStorage.getItem('app-settings');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.theme === 'dark' || parsed.theme === 'light') {
        return parsed.theme;
      }
    } catch (e) {
      console.error('Error parsing saved settings:', e);
    }
  }
  return 'light';
};

const applyTheme = (theme: Theme) => {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

export default function Settings() {
  const { t, i18n } = useTranslation('settings');
  
  const [theme, setTheme] = useState<Theme>(() => {
    const initialTheme = getInitialTheme();
    applyTheme(initialTheme);
    return initialTheme;
  });
  const [language, setLanguage] = useState<Language>(() => getInitialLanguage(i18n.language));
  const [currency, setCurrency] = useState<Currency>(() => {
    const saved = localStorage.getItem('app-settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.currency === 'VND' || parsed.currency === 'USD') {
          return parsed.currency;
        }
      } catch (e) {
        console.error('Error parsing saved settings:', e);
      }
    }
    return 'VND';
  });
  const [notifications, setNotifications] = useState<NotificationSettings>(() => {
   
    const saved = localStorage.getItem('app-settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.notifications) {
          return {
            inactivityReminders: parsed.notifications.inactivityReminders ?? true,
            recurringTransactionReminders: parsed.notifications.recurringTransactionReminders ?? true,
            goalDeadlineReminders: parsed.notifications.goalDeadlineReminders ?? true,
            budgetAlerts: parsed.notifications.budgetAlerts ?? true,
            lowBalanceAlerts: parsed.notifications.lowBalanceAlerts ?? true,
            largeTransactionAlerts: parsed.notifications.largeTransactionAlerts ?? true,
            goalProgressAlerts: parsed.notifications.goalProgressAlerts ?? true,
            goalCompletionAlerts: parsed.notifications.goalCompletionAlerts ?? true,
            monthlySummaryAlerts: parsed.notifications.monthlySummaryAlerts ?? true,
          };
        }
      } catch (e) {
        console.error('Error parsing saved settings:', e);
      }
    }
  
    return {
      inactivityReminders: true,
      recurringTransactionReminders: true,
      goalDeadlineReminders: true,
      budgetAlerts: true,
      lowBalanceAlerts: true,
      largeTransactionAlerts: true,
      goalProgressAlerts: true,
      goalCompletionAlerts: true,
      monthlySummaryAlerts: true,
    };
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // Apply language change
    if (language !== i18n.language) {
      i18n.changeLanguage(language);
    }
    // Apply theme
    applyTheme(theme);
    // Save settings to localStorage
    localStorage.setItem('app-settings', JSON.stringify({
      theme,
      language,
      currency,
      notifications,
    }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    const resetTheme = 'light';
    setTheme(resetTheme);
    setLanguage('vi');
    setCurrency('VND');
    setNotifications({
      inactivityReminders: true,
      recurringTransactionReminders: true,
      goalDeadlineReminders: true,
      budgetAlerts: true,
      lowBalanceAlerts: true,
      largeTransactionAlerts: true,
      goalProgressAlerts: true,
      goalCompletionAlerts: true,
      monthlySummaryAlerts: true,
    });
  };

  const toggleNotification = (key: keyof NotificationSettings) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <section className="space-y-8 w-full pb-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 p-8 text-white shadow-xl">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOGM5Ljk0MSAwIDE4LTguMDU5IDE4LTE4cy04LjA1OS0xOC0xOC0xOHptMCAzMmMtNy43MzIgMC0xNC02LjI2OC0xNC0xNHM2LjI2OC0xNCAxNC0xNCAxNCA2LjI2OCAxNCAxNC02LjI2OCAxNC0xNCAxNHoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjA1Ii8+PC9nPjwvc3ZnPg==')] opacity-30" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
              <Palette className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold">{t('title')}</h1>
          </div>
          <p className="text-white/80 text-lg">{t('subtitle')}</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Theme Section */}
        <div className="bg-card border rounded-2xl p-6 shadow-lg transition-all hover:shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-600">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">{t('display.title')}</h2>
              <p className="text-sm text-muted-foreground">{t('display.description')}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`group relative flex w-full flex-col rounded-xl border-2 p-5 text-left transition-all duration-300 ${
                theme === 'light'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg shadow-blue-100 dark:shadow-blue-900/20'
                  : 'border-border hover:border-blue-300 hover:bg-muted/50'
              }`}
            >
              {theme === 'light' && (
                <div className="absolute top-3 right-3 p-1 rounded-full bg-blue-500 text-white">
                  <Check className="w-3.5 h-3.5" />
                </div>
              )}
              <div className={`p-3 rounded-xl w-fit mb-3 transition-colors ${
                theme === 'light' ? 'bg-blue-100' : 'bg-muted group-hover:bg-blue-100'
              }`}>
                <Sun className={`w-6 h-6 transition-colors ${
                  theme === 'light' ? 'text-blue-600' : 'text-muted-foreground group-hover:text-blue-600'
                }`} />
              </div>
              <span className={`font-semibold text-lg mb-1 ${
                theme === 'light' ? 'text-blue-700' : 'text-foreground'
              }`}>
                {t('display.lightMode.title')}
              </span>
              <span className="text-sm text-muted-foreground">{t('display.lightMode.description')}</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`group relative flex w-full flex-col rounded-xl border-2 p-5 text-left transition-all duration-300 ${
                theme === 'dark'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg shadow-blue-100 dark:shadow-blue-900/20'
                  : 'border-border hover:border-blue-300 hover:bg-muted/50'
              }`}
            >
              {theme === 'dark' && (
                <div className="absolute top-3 right-3 p-1 rounded-full bg-blue-500 text-white">
                  <Check className="w-3.5 h-3.5" />
                </div>
              )}
              <div className={`p-3 rounded-xl w-fit mb-3 transition-colors ${
                theme === 'dark' ? 'bg-blue-100' : 'bg-muted group-hover:bg-blue-100'
              }`}>
                <Moon className={`w-6 h-6 transition-colors ${
                  theme === 'dark' ? 'text-blue-600' : 'text-muted-foreground group-hover:text-blue-600'
                }`} />
              </div>
              <span className={`font-semibold text-lg mb-1 ${
                theme === 'dark' ? 'text-blue-700' : 'text-foreground'
              }`}>
                {t('display.darkMode.title')}
              </span>
              <span className="text-sm text-muted-foreground">{t('display.darkMode.description')}</span>
            </button>
          </div>
        </div>

        {/* Language & Currency Section */}
        <div className="bg-card border rounded-2xl p-6 shadow-lg transition-all hover:shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl !bg-white dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 border border-teal-600 dark:border-teal-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">{t('language.title')}</h2>
              <p className="text-sm text-muted-foreground">{t('language.description')}</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <label htmlFor="language" className="block text-sm font-medium text-foreground">
                {t('language.languageLabel')}
              </label>
              <div className="relative">
                <select
                  id="language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  style={{ backgroundColor: 'white', color: 'rgb(17, 24, 39)' }}
                  className="w-full appearance-none rounded-xl border-2 border-border bg-white dark:!bg-gray-800 px-4 py-3.5 pr-10 text-gray-900 dark:!text-gray-100 font-medium transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 hover:border-blue-300"
                >
                  <option value="vi">{t('language.options.vi')}</option>
                  <option value="en">{t('language.options.en')}</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                  <svg className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label htmlFor="currency" className="block text-sm font-medium text-foreground">
                {t('language.currencyLabel')}
              </label>
              <div className="relative">
                <select
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as Currency)}
                  style={{ backgroundColor: 'white', color: 'rgb(17, 24, 39)' }}
                  className="w-full appearance-none rounded-xl border-2 border-border bg-white dark:!bg-gray-800 px-4 py-3.5 pr-10 text-gray-900 dark:!text-gray-100 font-medium transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 hover:border-blue-300"
                >
                  <option value="VND">{t('language.currencies.VND')}</option>
                  <option value="USD">{t('language.currencies.USD')}</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                  <svg className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="bg-card border rounded-2xl p-6 shadow-lg transition-all hover:shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-sky-100 text-sky-600">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">{t('notifications.title')}</h2>
              <p className="text-sm text-muted-foreground">{t('notifications.description')}</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* REMINDER Section */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                {t('notifications.categories.reminder')}
              </h3>
              <div className="space-y-1">
                {/* Inactivity Reminders */}
                <div className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{t('notifications.inactivityReminders.title')}</p>
                      <p className="text-sm text-muted-foreground">{t('notifications.inactivityReminders.description')}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleNotification('inactivityReminders')}
                    className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-4 focus:ring-blue-500/20 ${
                      notifications.inactivityReminders ? 'bg-blue-500' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        notifications.inactivityReminders ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Recurring Transaction Reminders */}
                <div className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{t('notifications.recurringTransactionReminders.title')}</p>
                      <p className="text-sm text-muted-foreground">{t('notifications.recurringTransactionReminders.description')}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleNotification('recurringTransactionReminders')}
                    className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-4 focus:ring-blue-500/20 ${
                      notifications.recurringTransactionReminders ? 'bg-blue-500' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        notifications.recurringTransactionReminders ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Goal Deadline Reminders */}
                <div className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{t('notifications.goalDeadlineReminders.title')}</p>
                      <p className="text-sm text-muted-foreground">{t('notifications.goalDeadlineReminders.description')}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleNotification('goalDeadlineReminders')}
                    className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-4 focus:ring-blue-500/20 ${
                      notifications.goalDeadlineReminders ? 'bg-blue-500' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        notifications.goalDeadlineReminders ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* WARNING Section */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                {t('notifications.categories.warning')}
              </h3>
              <div className="space-y-1">
                {/* Budget Alerts */}
                <div className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{t('notifications.budgetAlerts.title')}</p>
                      <p className="text-sm text-muted-foreground">{t('notifications.budgetAlerts.description')}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleNotification('budgetAlerts')}
                    className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-4 focus:ring-blue-500/20 ${
                      notifications.budgetAlerts ? 'bg-blue-500' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        notifications.budgetAlerts ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Low Balance Alerts */}
                <div className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{t('notifications.lowBalanceAlerts.title')}</p>
                      <p className="text-sm text-muted-foreground">{t('notifications.lowBalanceAlerts.description')}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleNotification('lowBalanceAlerts')}
                    className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-4 focus:ring-blue-500/20 ${
                      notifications.lowBalanceAlerts ? 'bg-blue-500' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        notifications.lowBalanceAlerts ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Large Transaction Alerts */}
                <div className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{t('notifications.largeTransactionAlerts.title')}</p>
                      <p className="text-sm text-muted-foreground">{t('notifications.largeTransactionAlerts.description')}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleNotification('largeTransactionAlerts')}
                    className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-4 focus:ring-blue-500/20 ${
                      notifications.largeTransactionAlerts ? 'bg-blue-500' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        notifications.largeTransactionAlerts ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* SUCCESS Section */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                {t('notifications.categories.success')}
              </h3>
              <div className="space-y-1">
                {/* Goal Progress Alerts */}
                <div className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-green-100 text-green-600">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{t('notifications.goalProgressAlerts.title')}</p>
                      <p className="text-sm text-muted-foreground">{t('notifications.goalProgressAlerts.description')}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleNotification('goalProgressAlerts')}
                    className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-4 focus:ring-blue-500/20 ${
                      notifications.goalProgressAlerts ? 'bg-blue-500' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        notifications.goalProgressAlerts ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Goal Completion Alerts */}
                <div className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-green-100 text-green-600">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{t('notifications.goalCompletionAlerts.title')}</p>
                      <p className="text-sm text-muted-foreground">{t('notifications.goalCompletionAlerts.description')}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleNotification('goalCompletionAlerts')}
                    className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-4 focus:ring-blue-500/20 ${
                      notifications.goalCompletionAlerts ? 'bg-blue-500' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        notifications.goalCompletionAlerts ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* INFO Section */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                {t('notifications.categories.info')}
              </h3>
              <div className="space-y-1">
                {/* Monthly Summary Alerts */}
                <div className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{t('notifications.monthlySummaryAlerts.title')}</p>
                      <p className="text-sm text-muted-foreground">{t('notifications.monthlySummaryAlerts.description')}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleNotification('monthlySummaryAlerts')}
                    className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-4 focus:ring-blue-500/20 ${
                      notifications.monthlySummaryAlerts ? 'bg-blue-500' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        notifications.monthlySummaryAlerts ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-border px-6 py-3 text-sm font-medium text-muted-foreground transition-all hover:border-red-300 hover:bg-red-50 hover:text-red-600"
        >
          <RotateCcw className="w-4 h-4" />
          {t('actions.reset')}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saved}
          className={`inline-flex items-center justify-center gap-2 rounded-xl px-8 py-3 text-sm font-semibold text-white transition-all shadow-lg ${
            saved
              ? 'bg-green-500 shadow-green-200'
              : 'bg-gradient-to-r from-blue-500 to-cyan-500 shadow-blue-200 hover:shadow-xl hover:scale-[1.02]'
          }`}
        >
          {saved ? (
            <>
              <Check className="w-4 h-4" />
              {t('actions.saved')}
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {t('actions.save')}
            </>
          )}
        </button>
      </div>
    </section>
  );
}
