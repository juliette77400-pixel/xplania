import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Copy, QrCode, Share2, ExternalLink } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareEnabled: boolean;
  shareUrl: string;
  destination?: string;
  onToggle: (enabled: boolean) => void;
}

const ShareTripDialog = ({ open, onOpenChange, shareEnabled, shareUrl, destination, onToggle }: Props) => {
  const { t } = useTranslation();
  const copy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    toast.success(t("trackingComp.share.linkCopied"));
  };

  const shareNative = async () => {
    if (!shareUrl || !navigator.share) {
      copy();
      return;
    }
    try {
      const dest = destination ? t("trackingComp.share.shareDest", { destination }) : "";
      await navigator.share({
        title: t("trackingComp.share.shareTitle", { dest }),
        text: t("trackingComp.share.shareText"),
        url: shareUrl,
      });
    } catch {
      /* user cancelled */
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            {t("trackingComp.share.title")}
          </DialogTitle>
          <DialogDescription>
            {t("trackingComp.share.desc")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          <div className="flex items-center justify-between rounded-xl border border-border p-3 bg-muted/20">
            <div>
              <p className="text-sm font-semibold">{t("trackingComp.share.publicShare")}</p>
              <p className="text-xs text-muted-foreground">
                {shareEnabled ? t("trackingComp.share.linkActive") : t("trackingComp.share.linkInactive")}
              </p>
            </div>
            <Switch checked={shareEnabled} onCheckedChange={onToggle} />
          </div>

          {shareEnabled && shareUrl ? (
            <>
              <div className="flex justify-center p-4 rounded-xl bg-white">
                <QRCodeSVG
                  value={shareUrl}
                  size={180}
                  level="M"
                  includeMargin={false}
                  bgColor="#ffffff"
                  fgColor="#0f172a"
                />
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-border p-2 bg-muted/30">
                <span className="flex-1 text-xs truncate text-muted-foreground px-2">
                  {shareUrl}
                </span>
                <Button size="sm" variant="ghost" onClick={copy} className="h-8 w-8 p-0">
                  <Copy className="w-3.5 h-3.5" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button onClick={copy} variant="outline" size="sm">
                  <Copy className="w-4 h-4 mr-1.5" /> {t("trackingComp.share.copy")}
                </Button>
                <Button onClick={shareNative} size="sm" className="gradient-button">
                  <Share2 className="w-4 h-4 mr-1.5" /> {t("trackingComp.share.share")}
                </Button>
              </div>

              <a
                href={shareUrl}
                target="_blank"
                rel="noopener"
                className="flex items-center justify-center gap-1.5 text-xs text-primary hover:underline"
              >
                <ExternalLink className="w-3 h-3" /> {t("trackingComp.share.preview")}
              </a>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
              <QrCode className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">{t("trackingComp.share.noShare")}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareTripDialog;
