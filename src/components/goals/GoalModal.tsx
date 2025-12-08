import { Button } from "../ui/Button";
import { useTranslation } from "react-i18next";

type Wallet = {
  id: number;
  user_id: number;
  name: string;
  balance: number;
};

interface GoalModalProps {
  open: boolean;
  editingId: string | null;
  title: string;
  targetAmount: string;
  selectedWallet: string;
  selectedStatus: string;
  dueDate: string;
  initialAmount: string;
  sourceWallet: string;
  wallets: Wallet[];
  error: string | null;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onTitleChange: (value: string) => void;
  onTargetAmountChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onDueDateChange: (value: string) => void;
  onInitialAmountChange: (value: string) => void;
  onSourceWalletChange: (value: string) => void;
}

export default function GoalModal({
  open,
  editingId,
  title,
  targetAmount,
  selectedWallet,
  selectedStatus,
  dueDate,
  initialAmount,
  sourceWallet,
  wallets,
  error,
  onClose,
  onSubmit,
  onTitleChange,
  onTargetAmountChange,
  onStatusChange,
  onDueDateChange,
  onInitialAmountChange,
  onSourceWalletChange,
}: GoalModalProps) {
  const { t } = useTranslation("goals");

  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-900/50 z-[60]">
      <div className="w-[480px] bg-white rounded-lg shadow-2xl p-5">
        <div className="flex justify-between items-center mb-3">
          <h3 className="m-0 font-bold">
            {editingId ? t("dialog.editTitle") : t("dialog.addTitle")}
          </h3>
          <button
            aria-label="Close"
            onClick={onClose}
            className="border-none bg-transparent cursor-pointer text-xl hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="text-[13px] text-gray-500 mb-3">
          {editingId ? (
            <>
              {t("dialog.editDescription")}:{" "}
              <strong>
                {wallets.find((w) => Number(w.id) === Number(selectedWallet))
                  ?.name || t("card.notAvailable")}
              </strong>
            </>
          ) : (
            t("dialog.addDescription")
          )}
        </div>

        <form onSubmit={onSubmit} className="grid gap-3">
          {error && <div className="text-red-700 text-[13px]">{error}</div>}

          <div>
            <label className="block text-[13px] font-medium mb-1.5 text-gray-800">
              {t("form.name")}
            </label>
            <input
              placeholder={t("form.namePlaceholder")}
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              className="w-full box-border px-2.5 py-2 rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium mb-1.5 text-gray-800">
              {t("form.targetAmount")}
            </label>
            <input
              type="text"
              value={targetAmount ? Number(targetAmount).toLocaleString() : ""}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                onTargetAmountChange(value);
              }}
              placeholder={t("form.targetAmountPlaceholder")}
              className="w-full box-border px-2.5 py-2 rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {!editingId && (
            <>
              <div>
                <label className="block text-[13px] font-medium mb-1.5 text-gray-800">
                  {t("form.currentAmount")}
                </label>
                <input
                  type="text"
                  value={
                    initialAmount ? Number(initialAmount).toLocaleString() : ""
                  }
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    onInitialAmountChange(value);
                  }}
                  placeholder={t("form.currentAmountPlaceholder")}
                  className="w-full box-border px-2.5 py-2 rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium mb-1.5 text-gray-800">
                  {t("form.sourceWallet")}
                </label>
                <select
                  value={sourceWallet}
                  onChange={(e) => onSourceWalletChange(e.target.value)}
                  className="w-full box-border px-2.5 py-2 rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!initialAmount || Number(initialAmount) <= 0}
                >
                  <option value="">{t("form.selectWallet")}</option>
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.balance.toLocaleString()} {t("currency")})
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-[13px] font-medium mb-1.5 text-gray-800">
              {t("form.status")}
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => onStatusChange(e.target.value)}
              className="w-full box-border px-2.5 py-2 rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="inProgress">{t("status.inProgress")}</option>
              <option value="paused">{t("status.paused")}</option>
            </select>
          </div>

          <div>
            <label className="block text-[13px] font-medium mb-1.5 text-gray-800">
              {t("form.deadline")}
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => onDueDateChange(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full box-border px-2.5 py-2 rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2 justify-end mt-3">
            <Button
              className="flex-1 bg-black text-white px-6 py-2.5"
              type="submit"
            >
              {editingId ? t("actions.update") : t("actions.add")}
            </Button>

            <Button
              variant="outline"
              className="min-w-[60px] px-4 py-2.5"
              onClick={onClose}
              type="button"
            >
              {t("actions.cancel")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
