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
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="text-sm font-medium text-gray-600 mb-1">
          {t("summary.totalGoals")}
        </div>
        <div className="text-3xl font-bold text-slate-900">{totalGoals}</div>
      </div>

      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="text-sm font-medium text-green-700 mb-1">
          {t("summary.completed")}
        </div>
        <div className="text-3xl font-bold text-green-600">
          {completedGoals}
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="text-sm font-medium text-blue-700 mb-1">
          {t("summary.inProgress")}
        </div>
        <div className="text-3xl font-bold text-blue-600">
          {inProgressGoals}
        </div>
      </div>
    </div>
  );
}
