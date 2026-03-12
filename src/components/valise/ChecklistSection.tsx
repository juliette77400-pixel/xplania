import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";

export interface ChecklistItem {
  name: string;
  description: string;
  checked: boolean;
}

interface ChecklistSectionProps {
  categories: Record<string, ChecklistItem[]>;
  onToggle: (category: string, index: number) => void;
  onAdd: (category: string, name: string) => void;
  onRemove: (category: string, index: number) => void;
}

const ChecklistSection = ({ categories, onToggle, onAdd, onRemove }: ChecklistSectionProps) => {
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState("");

  const handleAdd = (category: string) => {
    if (newItemName.trim()) {
      onAdd(category, newItemName.trim());
      setNewItemName("");
      setAddingTo(null);
    }
  };

  return (
    <>
      {Object.entries(categories).map(([category, items], catIdx) => (
        <motion.div
          key={category}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 + catIdx * 0.04 }}
          className="glass-card rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-foreground">{category}</h3>
            <span className="text-xs text-muted-foreground">
              {items.filter((i) => i.checked).length} / {items.length}
            </span>
          </div>
          <div className="space-y-2">
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <button
                  onClick={() => onToggle(category, i)}
                  className={`flex-1 flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                    item.checked
                      ? "bg-primary/10 border border-primary/20"
                      : "bg-muted/30 hover:bg-muted/50"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                      item.checked ? "bg-primary border-primary" : "border-muted-foreground/30"
                    }`}
                  >
                    {item.checked && <CheckCircle className="w-3.5 h-3.5 text-primary-foreground" />}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${item.checked ? "text-foreground" : "text-foreground/80"}`}>
                      {item.name}
                    </p>
                    {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                  </div>
                </button>
                <button
                  onClick={() => onRemove(category, i)}
                  className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add item */}
          {addingTo === category ? (
            <div className="mt-3 flex gap-2">
              <Input
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="Nom de l'objet…"
                className="h-9 text-sm bg-muted/50 border-border"
                onKeyDown={(e) => e.key === "Enter" && handleAdd(category)}
                autoFocus
              />
              <button
                onClick={() => handleAdd(category)}
                className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
              >
                Ajouter
              </button>
              <button
                onClick={() => { setAddingTo(null); setNewItemName(""); }}
                className="px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-sm hover:bg-muted/80"
              >
                Annuler
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAddingTo(category)}
              className="mt-3 flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
            >
              <Plus className="w-4 h-4" /> Ajouter un objet
            </button>
          )}
        </motion.div>
      ))}
    </>
  );
};

export default ChecklistSection;
