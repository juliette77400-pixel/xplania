import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  toolName: string;
}

const UpgradeDialog = ({ open, onOpenChange, toolName }: Props) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-md">
      <DialogHeader>
        <div className="mx-auto w-14 h-14 rounded-2xl gradient-button flex items-center justify-center mb-3">
          <Sparkles className="w-7 h-7 text-primary-foreground" />
        </div>
        <DialogTitle className="text-center text-2xl">Quota gratuit atteint</DialogTitle>
        <DialogDescription className="text-center">
          Tu as utilisé toutes tes générations gratuites pour <strong>{toolName}</strong>.
          Passe à <strong>Xplania Plus</strong> pour un accès illimité.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-3 py-4">
        {[
          "Générations illimitées sur tous les modules",
          "Recommandations IA prioritaires",
          "Export PDF & partage avancés",
          "Support communauté & nouveautés en avant-première",
        ].map((f) => (
          <div key={f} className="flex items-start gap-3">
            <div className="mt-0.5 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <Check className="w-3 h-3 text-primary" />
            </div>
            <p className="text-sm text-foreground">{f}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
          Plus tard
        </Button>
        <Button
          className="flex-1 gradient-button text-primary-foreground border-0"
          onClick={() => { window.location.href = "/offres"; }}
        >
          Voir les offres
        </Button>
      </div>
    </DialogContent>
  </Dialog>
);

export default UpgradeDialog;
