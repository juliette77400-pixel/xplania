import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, PenLine, Sparkles } from "lucide-react";

interface Props {
  cityId: string | null;
  onAdd: (input: { name: string; type: string; parent_id: string | null; description?: string; points?: number }) => void;
}

const TYPES = [
  { value: "place",     label: "📍 Lieu",       points: 30 },
  { value: "food",      label: "🍽️ Restaurant", points: 40 },
  { value: "culture",   label: "🏛️ Culture",    points: 50 },
  { value: "nature",    label: "🌿 Nature",     points: 40 },
  { value: "nightlife", label: "🌙 Nuit",       points: 50 },
  { value: "activity",  label: "🎯 Activité",   points: 60 },
  { value: "hotel",     label: "🏨 Hôtel",      points: 20 },
];

const AddNodeDialog = ({ cityId, onAdd }: Props) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("place");
  const [description, setDescription] = useState("");

  const reset = () => { setName(""); setDescription(""); setType("place"); };

  const submit = () => {
    if (!name.trim()) return;
    const def = TYPES.find((t) => t.value === type);
    onAdd({
      name: name.trim(),
      type,
      parent_id: cityId,
      description: description.trim() || undefined,
      points: def?.points,
    });
    reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Écrire mon voyage
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PenLine className="w-4 h-4 text-primary" />
            Ajoute une étape de voyage
          </DialogTitle>
          <DialogDescription className="text-xs">
            Écris toi-même ton parcours, pas besoin d'IA — chaque étape ajoute des points et débloque des badges.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="manual" className="mt-2">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="manual"><PenLine className="w-3.5 h-3.5 mr-1.5" /> Manuel</TabsTrigger>
            <TabsTrigger value="tips" disabled><Sparkles className="w-3.5 h-3.5 mr-1.5" /> Conseils</TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4 mt-4">
            <div className="space-y-1.5">
              <Label htmlFor="node-name">Nom de l'étape *</Label>
              <Input
                id="node-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex : Café de Flore, Sunset au Sacré-Cœur…"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label>Catégorie</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      <span className="flex items-center justify-between gap-4 w-full">
                        <span>{t.label}</span>
                        <span className="text-xs text-muted-foreground">+{t.points} pts</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="node-desc">Description / souvenir</Label>
              <Textarea
                id="node-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Une note, un ressenti, un détail à retenir…"
                rows={3}
                className="resize-none"
              />
            </div>

            <Button onClick={submit} className="w-full" disabled={!name.trim()}>
              Ajouter (+{TYPES.find((t) => t.value === type)?.points || 30} pts)
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AddNodeDialog;
