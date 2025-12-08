import { useTranslation } from "react-i18next";

interface GoalsSummaryProps {
  totalGoals: number;
  completedGoals: number;
  inProgressGoals: number;
}

export default function GoalsSummary({
  totalGoals,
  completedGoals,
  inProgressGoals,
}: GoalsSummaryProps) {
  const { t } = useTranslation("goals");

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
        <div className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
          {t("summary.totalGoals")}
        </div>
        <div className="text-3xl font-bold text-slate-900 dark:text-white">{totalGoals}</div>
      </div>

      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/40 dark:to-emerald-900/40 rounded-2xl p-6 border border-green-200 dark:border-green-800 shadow-sm hover:shadow-md transition-shadow">
        <div className="text-sm font-medium text-green-700 dark:text-green-200 mb-1">
          {t("summary.completed")}
        </div>
        <div className="text-3xl font-bold text-green-600 dark:text-green-300">
          {completedGoals}
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/40 dark:to-indigo-900/40 rounded-2xl p-6 border border-blue-200 dark:border-blue-800 shadow-sm hover:shadow-md transition-shadow">
        <div className="text-sm font-medium text-blue-700 dark:text-blue-200 mb-1">
          {t("summary.inProgress")}
        </div>
        <div className="text-3xl font-bold text-blue-600 dark:text-blue-300">
          {inProgressGoals}
        </div>
      </div>
    </div>
  );
}
