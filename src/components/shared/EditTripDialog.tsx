// ✨ NEW (Tâche 3) — Modale d'édition d'un voyage : titre, destination, dates.
import { useState, useEffect } from "react";
import { Pencil, Loader2, Save } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateTrip } from "@/hooks/useUpdateTrip";
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
  variant?: "icon" | "menu-item";
  onUpdated?: () => void;
  className?: string;
  stopPropagation?: boolean;
}

const EditTripDialog = ({ trip, variant = "icon", onUpdated, className, stopPropagation = true }: Props) => {
  const { updateTrip, updating } = useUpdateTrip();
  const [open, setOpen] = useState(false);
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

  const stop = (e: React.MouseEvent | React.PointerEvent) => {
    if (stopPropagation) {
      e.stopPropagation();
      e.preventDefault();
    }
  };

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
      <DialogTrigger asChild>
        {variant === "icon" ? (
          <button
            type="button"
            onClick={stop}
            onPointerDown={stop}
            aria-label="Modifier ce voyage"
            className={cn(
              "p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors",
              className,
            )}
          >
            <Pencil className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={stop}
            onPointerDown={stop}
            className={cn(
              "flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-muted/60 transition-colors",
              className,
            )}
          >
            <Pencil className="w-4 h-4" />
            <span>Modifier ce voyage</span>
          </button>
        )}
      </DialogTrigger>
      <DialogContent onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Modifier ce voyage</DialogTitle>
          <DialogDescription>
            Mets à jour le titre, la destination ou les dates. Les recommandations IA déjà générées ne seront pas écrasées.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="trip-title">Titre</Label>
            <Input id="trip-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Mon voyage à Lisbonne" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="trip-dest">Destination</Label>
            <Input id="trip-dest" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Portugal" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="trip-dep">Départ</Label>
              <Input id="trip-dep" type="date" value={dep} onChange={(e) => setDep(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="trip-ret">Retour</Label>
              <Input id="trip-ret" type="date" value={ret} onChange={(e) => setRet(e.target.value)} min={dep || undefined} />
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

export default EditTripDialog;
