import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface QuotaReachedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const QuotaReachedDialog = ({ open, onOpenChange }: QuotaReachedDialogProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSeeOffers = () => {
    onOpenChange(false);
    navigate("/offres");
    setTimeout(() => {
      const el = document.getElementById("tarifs");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md glass-card border-border">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-button flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <DialogTitle className="text-lg font-bold text-foreground">
              {t("quotaReached.title")}
            </DialogTitle>
          </div>
        </DialogHeader>
        <p className="text-sm text-muted-foreground py-2">
          {t("quotaReached.desc")}
        </p>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t("quotaReached.later")}
          </Button>
          <Button
            onClick={handleSeeOffers}
            className="gradient-button text-primary-foreground border-0"
          >
            {t("quotaReached.seeOffers")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuotaReachedDialog;
