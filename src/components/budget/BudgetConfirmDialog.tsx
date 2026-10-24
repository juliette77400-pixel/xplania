// Confirmation before any change that replaces the student's amounts.
import { useTranslation } from "react-i18next";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description: string;
  changes: Array<{ key: string; from: number; to: number }>;
  confirmLabel: string;
  onConfirm: () => void;
}

const BudgetConfirmDialog = ({ open, onOpenChange, title, description, changes, confirmLabel, onConfirm }: Props) => {
  const { t } = useTranslation();
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {changes.length > 0 ? (
          <ul className="space-y-1 text-sm">
            {changes.map((c) => (
              <li key={c.key} className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-1.5">
                <span>{t(`budget.categories.${c.key}`, { defaultValue: c.key })}</span>
                <span className="tabular-nums"><span className="text-muted-foreground line-through">{c.from} €</span> → <strong>{c.to} €</strong></span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">{t("budget2.confirm.noChange")}</p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={changes.length === 0}>{confirmLabel}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default BudgetConfirmDialog;
