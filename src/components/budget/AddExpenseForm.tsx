import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Sparkles, CreditCard, Banknote, Wallet, ArrowRightLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export interface Expense {
  amount: number;
  category: string;
  payment: string;
  comment: string;
  date: string;
}

const categories = ["Hébergement", "Transports locaux", "Activités", "Nourriture", "Shopping", "Extras", "Imprévus"];
const payments = [
  { value: "card", label: "Carte bancaire", icon: CreditCard },
  { value: "cash", label: "Espèces", icon: Banknote },
  { value: "paypal", label: "PayPal", icon: Wallet },
  { value: "transfer", label: "Virement", icon: ArrowRightLeft },
];

interface Props {
  onAdd: (expense: Expense) => void;
}

const AddExpenseForm = ({ onAdd }: Props) => {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [payment, setPayment] = useState("");
  const [comment, setComment] = useState("");
  const [autoClassify, setAutoClassify] = useState(false);

  const handleSubmit = () => {
    if (!amount || !category) {
      toast.error("Remplis au moins le montant et la catégorie");
      return;
    }
    onAdd({
      amount: parseFloat(amount),
      category,
      payment: payment || "card",
      comment,
      date: new Date().toISOString(),
    });
    toast.success("Dépense ajoutée !", { description: `${amount}€ en ${category}` });
    setAmount("");
    setCategory("");
    setPayment("");
    setComment("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl gradient-button flex items-center justify-center">
          <Plus className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Ajouter une Dépense</h2>
          <p className="text-sm text-muted-foreground">Enregistre tes dépenses pour un suivi en temps réel</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Amount */}
        <div className="space-y-2">
          <Label className="text-foreground font-semibold">Montant</Label>
          <div className="relative">
            <Input
              type="number"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground pr-8"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">€</span>
          </div>
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label className="text-foreground font-semibold">Catégorie</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="bg-muted border-border text-foreground">
              <SelectValue placeholder="Sélectionne une catégorie" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Payment */}
        <div className="space-y-2">
          <Label className="text-foreground font-semibold">Moyen de paiement</Label>
          <Select value={payment} onValueChange={setPayment}>
            <SelectTrigger className="bg-muted border-border text-foreground">
              <SelectValue placeholder="Sélectionne un moyen de paiement" />
            </SelectTrigger>
            <SelectContent>
              {payments.map((p) => (
                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Comment */}
        <div className="space-y-2">
          <Label className="text-foreground font-semibold">Commentaire (optionnel)</Label>
          <Input
            placeholder="Ex: Dîner au restaurant"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleSubmit}
        className="w-full mt-6 gradient-button text-primary-foreground font-bold py-3 rounded-xl transition-opacity hover:opacity-90"
      >
        Ajouter la dépense
      </motion.button>

      {/* Auto classify */}
      <div className="mt-4 flex items-center justify-between p-3 rounded-xl bg-muted/30">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm text-muted-foreground">Je peux classer automatiquement tes dépenses si tu veux.</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Activer</span>
          <Switch checked={autoClassify} onCheckedChange={setAutoClassify} />
        </div>
      </div>
    </motion.div>
  );
};

export default AddExpenseForm;
