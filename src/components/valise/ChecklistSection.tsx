import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Plus, Trash2, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
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
  isLoading?: boolean;
}

const SkeletonItem = () => (
  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 animate-pulse">
    <div className="w-5 h-5 rounded-md bg-muted-foreground/15 shrink-0" />
    <div className="flex-1 space-y-1.5">
      <div className="h-3.5 bg-muted-foreground/15 rounded w-3/5" />
      <div className="h-2.5 bg-muted-foreground/10 rounded w-2/5" />
    </div>
  </div>
);

const ChecklistSection = ({ categories, onToggle, onAdd, onRemove, isLoading }: ChecklistSectionProps) => {
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const handleAdd = (category: string) => {
    if (newItemName.trim()) {
      onAdd(category, newItemName.trim());
      setNewItemName("");
      setAddingTo(null);
    }
  };

  const toggleCollapse = (cat: string) =>
    setCollapsed((p) => ({ ...p, [cat]: !p[cat] }));

  if (isLoading) {
    return (
      <>
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-card rounded-2xl p-6 space-y-3 animate-pulse">
            <div className="h-5 bg-muted-foreground/15 rounded w-2/5 mb-4" />
            <SkeletonItem />
            <SkeletonItem />
            <SkeletonItem />
          </div>
        ))}
      </>
    );
  }

  return (
    <>
      {Object.entries(categories).map(([category, items], catIdx) => {
        const isCollapsed = collapsed[category];
        const checkedCount = items.filter((i) => i.checked).length;
        const allChecked = checkedCount === items.length;

        return (
          <motion.div
            key={category}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + catIdx * 0.03 }}
            layout
            className="glass-card rounded-2xl overflow-hidden"
          >
            {/* Category header — clickable to collapse */}
            <button
              onClick={() => toggleCollapse(category)}
              className="w-full flex items-center justify-between p-5 hover:bg-muted/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    allChecked ? "bg-primary/20" : "bg-muted/50"
                  }`}
                >
                  {allChecked ? (
                    <Sparkles className="w-4 h-4 text-primary" />
                  ) : (
                    <span className="text-xs font-bold text-muted-foreground">{checkedCount}</span>
                  )}
                </div>
                <div className="text-left">
                  <h3 className="text-sm font-bold text-foreground">{category}</h3>
                  <p className="text-[10px] text-muted-foreground">
                    {checkedCount}/{items.length} sélectionnés
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Mini progress bar */}
                <div className="hidden sm:block w-20 h-1.5 rounded-full bg-muted/50 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${items.length > 0 ? (checkedCount / items.length) * 100 : 0}%` }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  />
                </div>
                {isCollapsed ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </button>

            {/* Items */}
            <AnimatePresence initial={false}>
              {!isCollapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 space-y-1.5">
                    {items.map((item, i) => (
                      <motion.div
                        key={`${item.name}-${i}`}
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.2, delay: i * 0.02 }}
                        className="flex items-center gap-2"
                      >
                        <motion.button
                          onClick={() => onToggle(category, i)}
                          whileTap={{ scale: 0.97 }}
                          className={`flex-1 flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                            item.checked
                              ? "bg-primary/10 border border-primary/20"
                              : "bg-muted/20 hover:bg-muted/40 border border-transparent"
                          }`}
                        >
                          <motion.div
                            animate={item.checked ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                            transition={{ duration: 0.25 }}
                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                              item.checked ? "bg-primary border-primary" : "border-muted-foreground/30"
                            }`}
                          >
                            <AnimatePresence>
                              {item.checked && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  exit={{ scale: 0 }}
                                >
                                  <CheckCircle className="w-3.5 h-3.5 text-primary-foreground" />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm font-medium transition-all ${
                                item.checked
                                  ? "text-foreground"
                                  : "text-foreground/80"
                              }`}
                            >
                              {item.name}
                            </p>
                            {item.description && (
                              <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                            )}
                          </div>
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => onRemove(category, i)}
                          className="p-2 rounded-lg text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </motion.button>
                      </motion.div>
                    ))}

                    {/* Add item inline */}
                    <AnimatePresence>
                      {addingTo === category ? (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-2 flex gap-2"
                        >
                          <Input
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            placeholder="Nom de l'objet…"
                            className="h-9 text-sm bg-muted/30 border-border"
                            onKeyDown={(e) => e.key === "Enter" && handleAdd(category)}
                            autoFocus
                          />
                          <button
                            onClick={() => handleAdd(category)}
                            className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
                          >
                            OK
                          </button>
                          <button
                            onClick={() => {
                              setAddingTo(null);
                              setNewItemName("");
                            }}
                            className="px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs hover:bg-muted/80 transition-colors"
                          >
                            ✕
                          </button>
                        </motion.div>
                      ) : (
                        <motion.button
                          onClick={() => setAddingTo(category)}
                          whileHover={{ x: 4 }}
                          className="mt-2 flex items-center gap-2 text-xs text-primary/70 hover:text-primary transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" /> Ajouter un objet
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </>
  );
};

export default ChecklistSection;
