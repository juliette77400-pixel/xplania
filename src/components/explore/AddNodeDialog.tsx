import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, PenLine, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Props {
  cityId: string | null;
  onAdd: (input: { name: string; type: string; parent_id: string | null; description?: string; points?: number }) => void;
}

const AddNodeDialog = ({ cityId, onAdd }: Props) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("place");
  const [description, setDescription] = useState("");

  const TYPES = [
    { value: "place",     label: t("x2.tPlace"),     points: 30 },
    { value: "food",      label: t("x2.tFood"),      points: 40 },
    { value: "culture",   label: t("x2.tCulture"),   points: 50 },
    { value: "nature",    label: t("x2.tNature"),    points: 40 },
    { value: "nightlife", label: t("x2.tNightlife"), points: 50 },
    { value: "activity",  label: t("x2.tActivity"),  points: 60 },
    { value: "hotel",     label: t("x2.tHotel"),     points: 20 },
  ];

  const reset = () => { setName(""); setDescription(""); setType("place"); };

  const submit = () => {
    if (!name.trim()) return;
    const def = TYPES.find((tp) => tp.value === type);
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
          {t("x2.writeMyTrip")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PenLine className="w-4 h-4 text-primary" />
            {t("x2.addStep")}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {t("x2.addStepDesc")}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="manual" className="mt-2">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="manual"><PenLine className="w-3.5 h-3.5 mr-1.5" /> {t("x2.manual")}</TabsTrigger>
            <TabsTrigger value="tips" disabled><Sparkles className="w-3.5 h-3.5 mr-1.5" /> {t("x2.tips")}</TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4 mt-4">
            <div className="space-y-1.5">
              <Label htmlFor="node-name">{t("x2.stepName")}</Label>
              <Input
                id="node-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("x2.stepPlaceholder")}
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label>{t("x2.category")}</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES.map((tp) => (
                    <SelectItem key={tp.value} value={tp.value}>
                      <span className="flex items-center justify-between gap-4 w-full">
                        <span>{tp.label}</span>
                        <span className="text-xs text-muted-foreground">+{tp.points} pts</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="node-desc">{t("x2.memoryDesc")}</Label>
              <Textarea
                id="node-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("x2.memoryDescPlaceholder")}
                rows={3}
                className="resize-none"
              />
            </div>

            <Button onClick={submit} className="w-full" disabled={!name.trim()}>
              {t("x2.addBtn", { pts: TYPES.find((tp) => tp.value === type)?.points || 30 })}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AddNodeDialog;
