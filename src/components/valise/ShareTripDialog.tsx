import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Mail, Share2, MessageCircle } from "lucide-react";
import { toast } from "sonner";

interface ShareTripDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  destination: string;
  days: number;
  tripId?: string;
}

const ShareTripDialog = ({ open, onOpenChange, destination, days, tripId }: ShareTripDialogProps) => {
  const [copied, setCopied] = useState(false);
  const baseUrl = window.location.origin;
  const shareUrl = tripId
    ? `${baseUrl}/carnet/public/${tripId}`
    : `${baseUrl}/`;

  const message = `🌍 Découvre mon voyage à ${destination} (${days} jours) sur Xplania ! Valise, budget et formalités tout-en-un. ${shareUrl}`;

  const copy = async () => {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    toast.success("Lien copié 📋");
    setTimeout(() => setCopied(false), 2000);
  };

  const email = () => {
    window.location.href = `mailto:?subject=${encodeURIComponent(`Mon voyage à ${destination}`)}&body=${encodeURIComponent(message)}`;
  };

  const whatsapp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  };

  const native = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `Mon voyage à ${destination}`, text: message, url: shareUrl });
      } catch {}
    } else {
      copy();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Partager ce voyage</DialogTitle>
          <DialogDescription>
            Envoie ton itinéraire complet (valise, budget, formalités) à tes compagnons de voyage.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground border border-border/50">
            {message}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button onClick={copy} variant="outline" className="gap-2">
              <Copy className="w-4 h-4" /> {copied ? "Copié !" : "Copier"}
            </Button>
            <Button onClick={native} variant="outline" className="gap-2">
              <Share2 className="w-4 h-4" /> Partager
            </Button>
            <Button onClick={email} variant="outline" className="gap-2">
              <Mail className="w-4 h-4" /> Email
            </Button>
            <Button onClick={whatsapp} variant="outline" className="gap-2">
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareTripDialog;
