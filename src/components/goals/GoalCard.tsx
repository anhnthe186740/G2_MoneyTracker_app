import { Button } from "../ui/Button";
import { useTranslation } from "react-i18next";

type Goal = {
  id: string;
  user_id: string | number;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string;
  status: string;
  wallet_id: number;
};

type Wallet = {
  id: number;
  user_id: number;
  name: string;
  balance: number;
};

interface GoalCardProps {
  goal: Goal;
  wallet: Wallet | undefined;
  current: number;
  percent: number;
  completed: boolean;
  daysLeft: number | null;
  isFavorite: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
  onAddMoney: () => void;
}

export default function GoalCard({
  goal,
  wallet,
  current,
  percent,
  completed,
  daysLeft,
  isFavorite,
  onEdit,
  onDelete,
  onToggleFavorite,
  onAddMoney,
}: GoalCardProps) {
  const { t } = useTranslation("goals");
  const format = (v: number) => v.toLocaleString();

  return (
    <div
      className={`rounded-xl p-4 ${
        completed
          ? "bg-green-50 dark:bg-green-900/30 border-2 border-green-400 dark:border-green-600 shadow-sm"
          : "bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-sm"
      } hover:shadow-md transition-shadow`}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="font-bold text-gray-800 dark:text-foreground">{goal.name}</div>
          <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
            {t("card.wallet")}: {wallet?.name || t("card.notAvailable")}
          </div>
          <div className="text-xs mt-1.5">
            {completed ? (
              <span className="text-green-600 dark:text-green-300 font-semibold">
                {t("card.completed")}
              </span>
            ) : daysLeft !== null && daysLeft < 0 ? (
              <span className="text-red-600 dark:text-red-300 font-semibold">
                {t("card.overdue")}
              </span>
            ) : (
              <span className="text-gray-500 dark:text-gray-400">
                {daysLeft !== null
                  ? t("card.daysLeft", { days: daysLeft })
                  : t("card.progress", { percent })}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="border-none bg-transparent hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer p-1 rounded transition-colors text-blue-600 dark:text-blue-300 text-sm"
            aria-label="Edit"
          >
            ✏️
          </button>
          <button
            onClick={onDelete}
            className="border-none bg-transparent hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer p-1 rounded transition-colors text-red-600 dark:text-red-300 text-sm"
            aria-label="Delete"
          >
            🗑️
          </button>
          <button
            onClick={onToggleFavorite}
            className={`border-none bg-transparent cursor-pointer p-1 rounded transition-all text-xl ${
              isFavorite
                ? "text-yellow-500 hover:bg-yellow-100 dark:hover:bg-yellow-900/20 hover:scale-110"
                : "text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:scale-110 hover:text-yellow-400 dark:text-gray-300"
            }`}
            aria-label={isFavorite ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
          >
            {isFavorite ? "⭐" : "☆"}
          </button>
        </div>
      </div>

      <div className="flex justify-between text-[13px] text-gray-500 dark:text-gray-400 mb-2">
        <div>
          {t("card.current")}: {format(current)} {t("currency")}
        </div>
        <div>
          {t("card.target")}: {format(goal.target_amount)} {t("currency")}
        </div>
      </div>

      <div className="h-2.5 bg-gray-200 dark:bg-slate-800 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full ${completed ? "bg-green-500 dark:bg-green-400" : "bg-blue-500 dark:bg-blue-400"}`}
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      </div>
      <div className="text-center text-xs text-gray-500 dark:text-gray-400 mb-2">
        {Math.min(100, percent)}% {t("card.percentComplete")}
      </div>

      <div className="border-t border-gray-100 dark:border-slate-800 mt-3 pt-3 text-[13px] text-gray-600 dark:text-gray-300 flex justify-between items-center">
        <div>
          {t("card.remaining")}:{" "}
          <span className="font-semibold">
            {format(Math.max(0, goal.target_amount - current))} {t("currency")}
          </span>
        </div>
        {!completed && (
          <Button
            className="bg-[#0b122a] hover:bg-[#1a2645] text-white px-3.5 py-1.5 rounded-lg text-sm transition-colors"
            onClick={onAddMoney}
          >
            {t("actions.addMoney")}
          </Button>
        )}
      </div>
    </div>
  );
}
