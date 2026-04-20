import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";

interface Props {
  cityId: string | null;
  onAdd: (input: { name: string; type: string; parent_id: string | null }) => void;
}

const AddNodeDialog = ({ cityId, onAdd }: Props) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("place");

  const submit = () => {
    if (!name.trim()) return;
    onAdd({ name: name.trim(), type, parent_id: cityId });
    setName("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un lieu
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Nouveau point d'intérêt</DialogTitle></DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label htmlFor="node-name">Nom du lieu</Label>
            <Input id="node-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Café de Flore" />
          </div>
          <div>
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="place">📍 Lieu</SelectItem>
                <SelectItem value="food">🍽️ Restaurant</SelectItem>
                <SelectItem value="culture">🏛️ Culture</SelectItem>
                <SelectItem value="nature">🌿 Nature</SelectItem>
                <SelectItem value="nightlife">🌙 Nuit</SelectItem>
                <SelectItem value="activity">🎯 Activité</SelectItem>
                <SelectItem value="hotel">🏨 Hôtel</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={submit} className="w-full" disabled={!name.trim()}>Ajouter (+10pts)</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddNodeDialog;
