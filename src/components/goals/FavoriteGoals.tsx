import { useTranslation } from "react-i18next";
import GoalCard from "./GoalCard";

type Goal = {
  id: string;
  user_id: string | number;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string;
  status: string;
  wallet_id: number | string;
};

type Wallet = {
  id: number;
  user_id: number;
  name: string;
  balance: number;
};

interface FavoriteGoalsProps {
  favoriteGoalIds: Set<string>;
  goals: Goal[];
  wallets: Wallet[];
  calcProgress: (goalId: string) => { current: number; percent: number; completed: boolean };
  getWallet: (walletId: number | string | undefined) => Wallet | undefined;
  onEdit: (goal: Goal) => void;
  onDelete: (goal: Goal) => void;
  onToggleFavorite: (goalId: string) => void;
  onAddMoney: (goalId: string) => void;
}

export default function FavoriteGoals({
  favoriteGoalIds,
  goals,
  wallets,
  calcProgress,
  getWallet,
  onEdit,
  onDelete,
  onToggleFavorite,
  onAddMoney,
}: FavoriteGoalsProps) {
  const { t } = useTranslation("goals");

  if (favoriteGoalIds.size === 0) return null;

  return (
    <div className="mb-6">
      <h3 className="font-semibold text-xl mb-4 text-foreground flex items-center gap-2">
        ⭐ {t("favorites.title")}
      </h3>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-3">
        {[...favoriteGoalIds]
          .map((id) => goals.find((g) => g.id === id))
          .filter(Boolean)
          .map((goal) => {
            const { current, percent, completed } = calcProgress(goal!.id);
            const wallet = getWallet(goal!.wallet_id);
            const daysLeft = goal!.deadline
              ? Math.ceil(
                  (new Date(goal!.deadline).getTime() - Date.now()) / 86400000
                )
              : null;

            return (
              <GoalCard
                key={goal!.id}
                goal={goal!}
                wallet={wallet}
                current={current}
                percent={percent}
                completed={completed}
                daysLeft={daysLeft}
                isFavorite={true}
                onEdit={() => onEdit(goal!)}
                onDelete={() => onDelete(goal!)}
                onToggleFavorite={() => onToggleFavorite(goal!.id)}
                onAddMoney={() => onAddMoney(goal!.id)}
              />
            );
          })}
      </div>
    </div>
  );
}
