import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Plus, Sparkles, CreditCard, Banknote, Wallet, ArrowRightLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { classifyExpense } from "@/lib/cost-of-living";

export interface Expense {
  id: string;
  amount: number;
  category: string;
  payment: string;
  comment: string;
  date: string;
}

const categoryKeys = ["accommodation", "localTransport", "activities", "food", "shopping", "extras", "unexpected", "flights", "insurance", "connectivity", "fees"] as const;
const paymentKeys = [
  { value: "card", icon: CreditCard },
  { value: "cash", icon: Banknote },
  { value: "paypal", icon: Wallet },
  { value: "transfer", icon: ArrowRightLeft },
] as const;

interface Props {
  onAdd: (expense: Expense) => void;
}

const AddExpenseForm = ({ onAdd }: Props) => {
  const { t } = useTranslation();
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [payment, setPayment] = useState("");
  const [comment, setComment] = useState("");
  const [autoClassify, setAutoClassify] = useState(() => {
    try { return localStorage.getItem("xplania-budget-autoclassify") === "1"; } catch { return false; }
  });
  const toggleAuto = (v: boolean) => {
    setAutoClassify(v);
    try { localStorage.setItem("xplania-budget-autoclassify", v ? "1" : "0"); } catch { /* ignore */ }
  };
  const guessed = autoClassify ? classifyExpense(comment) : null;

  const handleSubmit = () => {
    // When auto-classification is on, the comment decides the category;
    // a manual choice is only used when nothing could be recognised.
    const finalCategory = (autoClassify && guessed) || category || (autoClassify ? "extras" : "");
    if (!amount || !finalCategory) {
      toast.error(t(autoClassify ? "budget.addToastMissingAuto" : "budget.addToastMissing"));
      return;
    }
    onAdd({
      id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `exp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      amount: parseFloat(amount),
      category: finalCategory,
      payment: payment || "card",
      comment,
      date: new Date().toISOString(),
    });
    toast.success(t("budget.addToastAdded"), {
      description: t("budget.addToastAddedDesc", { amount, category: t(`budget.categories.${finalCategory}`) }),
    });
    setAmount("");
    setCategory("");
    setPayment("");
    setComment("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl gradient-button flex items-center justify-center">
          <Plus className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">{t("budget.addExpenseTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("budget.addExpenseSubtitle")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-foreground font-semibold">{t("budget.addAmount")}</Label>
          <div className="relative">
            <Input
              type="number"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground pr-8"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">€</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-foreground font-semibold">{t("budget.addCategory")}</Label>
          <Select value={(autoClassify && guessed) || category} onValueChange={setCategory} disabled={autoClassify && !!guessed}>
            <SelectTrigger className="bg-muted border-border text-foreground">
              <SelectValue placeholder={t("budget.addCategoryPh")} />
            </SelectTrigger>
            <SelectContent>
              {categoryKeys.map((cat) => (
                <SelectItem key={cat} value={cat}>{t(`budget.categories.${cat}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {autoClassify && (
            <p className="text-xs text-primary">
              {guessed
                ? t("budget.addAutoDetected", { category: t(`budget.categories.${guessed}`) })
                : t("budget.addAutoHint")}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-foreground font-semibold">{t("budget.addPayment")}</Label>
          <Select value={payment} onValueChange={setPayment}>
            <SelectTrigger className="bg-muted border-border text-foreground">
              <SelectValue placeholder={t("budget.addPaymentPh")} />
            </SelectTrigger>
            <SelectContent>
              {paymentKeys.map((p) => (
                <SelectItem key={p.value} value={p.value}>{t(`budget.payments.${p.value}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-foreground font-semibold">{t("budget.addComment")}</Label>
          <Input
            placeholder={t("budget.addCommentPh")}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleSubmit}
        className="w-full mt-6 gradient-button text-primary-foreground font-bold py-3 rounded-xl transition-opacity hover:opacity-90"
      >
        {t("budget.addCta")}
      </motion.button>

      <div className="mt-4 flex items-center justify-between p-3 rounded-xl bg-muted/30">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm text-muted-foreground">{t("budget.addAutoClassify")}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{t("budget.addEnable")}</span>
          <Switch checked={autoClassify} onCheckedChange={toggleAuto} aria-label={t("budget.addAutoClassify")} />
        </div>
      </div>
    </motion.div>
  );
};

export default AddExpenseForm;
