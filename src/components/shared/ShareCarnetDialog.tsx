// ✨ NEW — Dialog de partage carnet (URL publique + QR + preview OG)
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { QRCodeCanvas } from "qrcode.react";
import { Share2, Copy, Check, Globe, Lock, Mail, Image as ImageIcon, Download } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  journalId: string;
  isPublic: boolean;
  publicSlug: string | null;
  title: string;
  destination?: string | null;
  onUpdated?: () => void;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const ShareCarnetDialog = ({
  open, onOpenChange, journalId, isPublic, publicSlug, title, destination, onUpdated,
}: Props) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [pub, setPub] = useState(isPublic);
  const [slug, setSlug] = useState(publicSlug);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setPub(isPublic);
    setSlug(publicSlug);
  }, [isPublic, publicSlug, open]);

  const publicUrl = slug ? `${window.location.origin}/carnet/public/${slug}` : "";
  const ogUrl = slug ? `${SUPABASE_URL}/functions/v1/og-image?kind=carnet&slug=${encodeURIComponent(slug)}` : "";

  const togglePublic = async (val: boolean) => {
    setBusy(true);
    const newSlug = val && !slug ? (crypto.randomUUID() + crypto.randomUUID()).replace(/-/g, "").slice(0, 32) : slug;
    const { error } = await supabase
      .from("journals")
      .update({ is_public: val, public_slug: newSlug })
      .eq("id", journalId);
    setBusy(false);
    if (error) {
      toast.error(t("shareDialog.errorToggle"));
      return;
    }
    setPub(val);
    setSlug(newSlug);
    toast.success(val ? t("shareDialog.published") : t("shareDialog.madePrivate"));
    onUpdated?.();
  };

  const copy = async () => {
    if (!publicUrl) return;
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    toast.success(t("shareDialog.linkCopied"));
    setTimeout(() => setCopied(false), 2000);
  };

  const shareNative = async () => {
    if (!publicUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({ title, text: destination ? `${title} — ${destination}` : title, url: publicUrl });
      } catch { /* cancelled */ }
    } else {
      copy();
    }
  };

  const shareEmail = () => {
    const subject = encodeURIComponent(`${title} · Xplania`);
    const body = encodeURIComponent(`${t("shareDialog.emailBody")}\n\n${publicUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const downloadQr = () => {
    const canvas = document.querySelector<HTMLCanvasElement>("#share-qr-canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `qr-${slug}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            {t("shareDialog.title")}
          </DialogTitle>
          <DialogDescription>{t("shareDialog.description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Toggle public */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
            <div className="flex items-center gap-2">
              {pub ? <Globe className="w-4 h-4 text-primary" /> : <Lock className="w-4 h-4 text-muted-foreground" />}
              <div>
                <p className="text-sm font-medium">{pub ? t("shareDialog.public") : t("shareDialog.private")}</p>
                <p className="text-xs text-muted-foreground">{pub ? t("shareDialog.publicHint") : t("shareDialog.privateHint")}</p>
              </div>
            </div>
            <Switch checked={pub} onCheckedChange={togglePublic} disabled={busy} />
          </div>

          {pub && publicUrl && (
            <>
              {/* Lien */}
              <div className="flex gap-2">
                <input
                  value={publicUrl}
                  readOnly
                  className="flex-1 px-3 py-2 rounded-lg bg-muted/30 text-xs border border-border"
                  onFocus={(e) => e.currentTarget.select()}
                />
                <Button variant="outline" size="icon" onClick={copy}>
                  {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={shareEmail}>
                  <Mail className="w-4 h-4 mr-1.5" /> Email
                </Button>
                <Button variant="outline" onClick={shareNative}>
                  <Share2 className="w-4 h-4 mr-1.5" /> {t("shareDialog.share")}
                </Button>
              </div>

              {/* QR Code */}
              <div className="rounded-xl border border-border p-4 bg-white text-center space-y-2">
                <QRCodeCanvas
                  id="share-qr-canvas"
                  value={publicUrl}
                  size={160}
                  includeMargin
                  className="mx-auto"
                />
                <Button variant="ghost" size="sm" onClick={downloadQr} className="text-xs text-muted-foreground hover:text-foreground">
                  <Download className="w-3 h-3 mr-1" /> {t("shareDialog.downloadQr")}
                </Button>
              </div>

              {/* OG Preview */}
              <details className="rounded-xl border border-border p-3">
                <summary className="cursor-pointer text-xs flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
                  <ImageIcon className="w-3.5 h-3.5" /> {t("shareDialog.previewOg")}
                </summary>
                <div className="mt-3">
                  <img
                    src={ogUrl}
                    alt={t("shareDialog.previewOg")}
                    className="w-full rounded-lg border border-border"
                    loading="lazy"
                  />
                  <p className="text-[10px] text-muted-foreground mt-2">{t("shareDialog.ogHint")}</p>
                </div>
              </details>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareCarnetDialog;
