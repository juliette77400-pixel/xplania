// ✨ NEW (Tâche 3) — Menu d'actions par voyage : Modifier / Dupliquer / Supprimer.
// Utilise le DropdownMenu shadcn. Stop la propagation pour ne pas ouvrir
// le voyage quand on clique sur le bouton ⋯.
import { useState } from "react";
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
}

interface Props {
  trip: Trip;
  onChanged?: () => void;
  onDeleted?: () => void;
  onDuplicated?: (newTripId: string) => void;
  className?: string;
}

const TripActionsMenu = ({ trip, onChanged, onDeleted, onDuplicated, className }: Props) => {
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
            aria-label="Actions du voyage"
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
            <Pencil className="w-4 h-4 mr-2" /> Modifier
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleDuplicate} disabled={!!duplicating}>
            <Copy className="w-4 h-4 mr-2" /> Refaire ce voyage
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={(e) => { e.preventDefault(); setConfirmDelete(true); }}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="w-4 h-4 mr-2" /> Supprimer
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
            <AlertDialogTitle>Supprimer ce voyage ?</AlertDialogTitle>
            <AlertDialogDescription>
              {(trip.title || trip.destination) ? (
                <>Es-tu sûr(e) de vouloir supprimer <strong className="text-foreground">{trip.title || trip.destination}</strong> ? <br /></>
              ) : "Es-tu sûr(e) de vouloir supprimer ce voyage ? "}
              Cette action est <strong>irréversible</strong>. Toutes les données associées (carnet, suivi GPS, badges, favoris liés) seront aussi supprimées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={!!deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting === trip.id ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Suppression…</>
              ) : (
                <><Trash2 className="w-4 h-4 mr-2" /> Supprimer définitivement</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// Petit wrapper qui réutilise la logique d'EditTripDialog mais avec open contrôlé.
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save } from "lucide-react";
import { useEffect } from "react";
import { useUpdateTrip } from "@/hooks/useUpdateTrip";

const EditDialogControlled = ({
  trip, open, setOpen, onUpdated,
}: { trip: Trip; open: boolean; setOpen: (v: boolean) => void; onUpdated?: () => void }) => {
  const { updateTrip, updating } = useUpdateTrip();
  const [title, setTitle] = useState(trip.title || "");
  const [destination, setDestination] = useState(trip.destination || "");
  const [dep, setDep] = useState(trip.departure_date || "");
  const [ret, setRet] = useState(trip.return_date || "");

  useEffect(() => {
    if (open) {
      setTitle(trip.title || "");
      setDestination(trip.destination || "");
      setDep(trip.departure_date || "");
      setRet(trip.return_date || "");
    }
  }, [open, trip]);

  const handleSave = async () => {
    const ok = await updateTrip(trip.id, {
      title: title.trim() || null,
      destination: destination.trim() || null,
      departure_date: dep || null,
      return_date: ret || null,
    });
    if (ok) {
      setOpen(false);
      onUpdated?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Modifier ce voyage</DialogTitle>
          <DialogDescription>
            Mets à jour le titre, la destination ou les dates.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="tam-title">Titre</Label>
            <Input id="tam-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tam-dest">Destination</Label>
            <Input id="tam-dest" value={destination} onChange={(e) => setDestination(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="tam-dep">Départ</Label>
              <Input id="tam-dep" type="date" value={dep} onChange={(e) => setDep(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tam-ret">Retour</Label>
              <Input id="tam-ret" type="date" value={ret} onChange={(e) => setRet(e.target.value)} min={dep || undefined} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={updating}>Annuler</Button>
          <Button onClick={handleSave} disabled={updating} className="gradient-button">
            {updating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TripActionsMenu;
