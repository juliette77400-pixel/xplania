import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Mail, Share2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface ShareTripDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  destination: string;
  days: number;
  tripId?: string;
}

const ShareTripDialog = ({ open, onOpenChange, destination, days, tripId }: ShareTripDialogProps) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const baseUrl = window.location.origin;
  const shareUrl = tripId ? `${baseUrl}/carnet/public/${tripId}` : `${baseUrl}/`;

  const message = t("valise.shareMessage", { destination, days, url: shareUrl });

  const copy = async () => {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    toast.success(t("valise.shareCopyToast"));
    setTimeout(() => setCopied(false), 2000);
  };

  const email = () => {
    window.location.href = `mailto:?subject=${encodeURIComponent(t("valise.shareEmailSubject", { destination }))}&body=${encodeURIComponent(message)}`;
  };

  const whatsapp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  };

  const native = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: t("valise.shareEmailSubject", { destination }), text: message, url: shareUrl });
      } catch {}
    } else {
      copy();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("valise.shareDialogTitle")}</DialogTitle>
          <DialogDescription>{t("valise.shareDialogDesc")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground border border-border/50">
            {message}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button onClick={copy} variant="outline" className="gap-2">
              <Copy className="w-4 h-4" /> {copied ? t("valise.shareCopied") : t("valise.shareCopy")}
            </Button>
            <Button onClick={native} variant="outline" className="gap-2">
              <Share2 className="w-4 h-4" /> {t("valise.shareNative")}
            </Button>
            <Button onClick={email} variant="outline" className="gap-2">
              <Mail className="w-4 h-4" /> {t("valise.shareEmail")}
            </Button>
            <Button onClick={whatsapp} variant="outline" className="gap-2">
              <MessageCircle className="w-4 h-4" /> {t("valise.shareWhatsApp")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareTripDialog;
