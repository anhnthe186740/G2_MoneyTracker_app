import { Button } from "../ui/Button";
import { useTranslation } from "react-i18next";

type Wallet = {
  id: number;
  user_id: number;
  name: string;
  balance: number;
};

interface AddMoneyModalProps {
  open: boolean;
  walletName: string;
  amount: string;
  fromWallet: string;
  wallets: Wallet[];
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onAmountChange: (value: string) => void;
  onFromWalletChange: (value: string) => void;
}

export default function AddMoneyModal({
  open,
  walletName,
  amount,
  fromWallet,
  wallets,
  onClose,
  onSubmit,
  onAmountChange,
  onFromWalletChange,
}: AddMoneyModalProps) {
  const { t } = useTranslation("goals");

  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-900/50 z-[60]">
      <div className="w-[480px] bg-white rounded-lg shadow-2xl p-5">
        <div className="flex justify-between items-center mb-3">
          <h3 className="m-0 font-bold">{t("dialog.addMoneyTitle")}</h3>
          <button
            aria-label="Close"
            onClick={onClose}
            className="border-none bg-transparent cursor-pointer text-xl hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="text-[13px] text-gray-500 mb-3">
          {t("card.wallet")}: <strong>{walletName || t("card.notAvailable")}</strong>
        </div>

        <form className="grid gap-3" onSubmit={onSubmit}>
          <div>
            <label className="block text-[13px] font-medium mb-1.5 text-gray-800">
              {t("form.amountToAdd")}
            </label>
            <input
              type="text"
              value={amount ? Number(amount).toLocaleString() : ""}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                onAmountChange(value);
              }}
              placeholder={t("form.amountPlaceholder")}
              className="w-full box-border px-2.5 py-2 rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium mb-1.5 text-gray-800">
              {t("form.sourceWallet")}
            </label>
            <select
              value={fromWallet}
              onChange={(e) => onFromWalletChange(e.target.value)}
              className="w-full box-border px-2.5 py-2 rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t("form.selectSourceWallet")}</option>
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.balance.toLocaleString()} {t("currency")})
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 justify-end mt-3">
            <Button
              className="flex-1 bg-black text-white px-6 py-2.5"
              type="submit"
            >
              {t("actions.confirm")}
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
