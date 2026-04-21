// ✨ NEW (Tâche 1) — Bouton réutilisable de suppression d'un voyage avec
// modale de confirmation. Variants : "icon" (corbeille discrète sur cartes)
// ou "menu-item" (entrée rouge dans un menu d'actions).
import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useDeleteTrip } from "@/hooks/useDeleteTrip";
import { cn } from "@/lib/utils";

interface Props {
  tripId: string;
  tripLabel?: string;
  variant?: "icon" | "menu-item" | "ghost-text";
  onDeleted?: () => void;
  className?: string;
  /** When true, prevents click bubbling to parent Link/card */
  stopPropagation?: boolean;
}

const DeleteTripButton = ({
  tripId,
  tripLabel,
  variant = "icon",
  onDeleted,
  className,
  stopPropagation = true,
}: Props) => {
  const { deleteTrip, deleting } = useDeleteTrip();
  const [open, setOpen] = useState(false);
  const isDeleting = deleting === tripId;

  const handleConfirm = async () => {
    const ok = await deleteTrip(tripId);
    setOpen(false);
    if (ok) onDeleted?.();
  };

  const stop = (e: React.MouseEvent | React.PointerEvent) => {
    if (stopPropagation) {
      e.stopPropagation();
      e.preventDefault();
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {variant === "icon" ? (
          <button
            type="button"
            onClick={stop}
            onPointerDown={stop}
            aria-label="Supprimer ce voyage"
            disabled={isDeleting}
            className={cn(
              "p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors",
              className
            )}
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </button>
        ) : variant === "menu-item" ? (
          <button
            type="button"
            onClick={stop}
            onPointerDown={stop}
            disabled={isDeleting}
            className={cn(
              "flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors",
              className
            )}
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            <span>Supprimer ce voyage</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={stop}
            onPointerDown={stop}
            disabled={isDeleting}
            className={cn(
              "inline-flex items-center gap-1.5 text-xs text-destructive hover:underline",
              className
            )}
          >
            {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
            Supprimer
          </button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer ce voyage ?</AlertDialogTitle>
          <AlertDialogDescription>
            {tripLabel ? (
              <>
                Es-tu sûr(e) de vouloir supprimer <strong className="text-foreground">{tripLabel}</strong> ?
                <br />
              </>
            ) : (
              "Es-tu sûr(e) de vouloir supprimer ce voyage ? "
            )}
            Cette action est <strong>irréversible</strong>. Toutes les données associées
            (carnet, suivi GPS, badges, favoris liés) seront aussi supprimées.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Suppression…
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" /> Supprimer définitivement
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteTripButton;
