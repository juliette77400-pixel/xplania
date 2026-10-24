// ✨ NEW (Tâche 3) — Menu d'actions par voyage : Modifier / Dupliquer / Supprimer.
// Utilise le DropdownMenu shadcn. Stop la propagation pour ne pas ouvrir
// le voyage quand on clique sur le bouton ⋯.
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { MoreVertical, Pencil, Copy, Trash2, Loader2 } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import EditTripDialog from "@/components/shared/EditTripDialog";
import { useDuplicateTrip } from "@/hooks/useDuplicateTrip";
import { useDeleteTrip } from "@/hooks/useDeleteTrip";
import { cn } from "@/lib/utils";

interface Trip {
  id: string;
  title: string | null;
  destination: string | null;
  departure_date: string | null;
  return_date: string | null;
  form_data?: unknown;
}

interface Props {
  trip: Trip;
  onChanged?: () => void;
  onDeleted?: () => void;
  onDuplicated?: (newTripId: string) => void;
  className?: string;
}

const TripActionsMenu = ({ trip, onChanged, onDeleted, onDuplicated, className }: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { duplicateTrip, duplicating } = useDuplicateTrip();
  const { deleteTrip, deleting } = useDeleteTrip();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isBusy = duplicating === trip.id || deleting === trip.id;

  const handleDuplicate = async (e: Event | React.SyntheticEvent) => {
    (e as any).preventDefault?.();
    const newId = await duplicateTrip(trip.id);
    if (newId) {
      if (onDuplicated) onDuplicated(newId);
      else navigate(`/carnet/${newId}`);
    }
  };

  const handleDelete = async () => {
    const ok = await deleteTrip(trip.id);
    setConfirmDelete(false);
    if (ok) onDeleted?.();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          asChild
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
        >
          <button
            type="button"
            aria-label={t("ui2.TripActionsMenu.tripActions")}
            className={cn(
              "p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors bg-background/70 backdrop-blur-sm border border-border/40",
              className,
            )}
          >
            {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <MoreVertical className="w-4 h-4" />}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setEditOpen(true); }}>
            <Pencil className="w-4 h-4 mr-2" /> {t("ui2.TripActionsMenu.edit")}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleDuplicate} disabled={!!duplicating}>
            <Copy className="w-4 h-4 mr-2" /> {t("ui2.TripActionsMenu.duplicate")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={(e) => { e.preventDefault(); setConfirmDelete(true); }}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="w-4 h-4 mr-2" /> {t("ui2.TripActionsMenu.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Édition — Dialog contrôlé via state pour pouvoir l'ouvrir depuis un menu item */}
      {editOpen && (
        <EditDialogControlled
          trip={trip}
          open={editOpen}
          setOpen={setEditOpen}
          onUpdated={onChanged}
        />
      )}

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("ui2.TripActionsMenu.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {(trip.title || trip.destination) ? (
                <>{t("ui2.TripActionsMenu.confirmDeleteNamed", { name: trip.title || trip.destination })} <br /></>
              ) : t("ui2.TripActionsMenu.confirmDeleteGeneric") + " "}
              {t("ui2.TripActionsMenu.irreversibleWarning")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deleting}>{t("ui2.TripActionsMenu.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={!!deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting === trip.id ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t("ui2.TripActionsMenu.deleting")}</>
              ) : (
                <><Trash2 className="w-4 h-4 mr-2" /> {t("ui2.TripActionsMenu.deletePermanently")}</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// Editing a trip now covers every answer of the preparation questionnaire.
import PrepTripEditDialog from "@/components/shared/PrepTripEditDialog";

const EditDialogControlled = ({
  trip, open, setOpen, onUpdated,
}: { trip: Trip; open: boolean; setOpen: (v: boolean) => void; onUpdated?: () => void }) => (
  <PrepTripEditDialog trip={trip} open={open} setOpen={setOpen} onUpdated={onUpdated} />
);
