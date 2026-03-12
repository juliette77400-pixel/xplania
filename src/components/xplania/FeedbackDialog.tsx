import { useState } from "react";
import emailjs from "@emailjs/browser";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MessageSquare, Send, CheckCircle, Star } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FeedbackDialog = ({ open, onOpenChange }: Props) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [suggestions, setSuggestions] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !suggestions.trim() || rating === 0) {
      toast.error("Veuillez remplir tous les champs et donner une note");
      return;
    }

    setSending(true);

    try {
      await emailjs.send(
        "service_23bwf9g",
        "template_206dhup",
        {
          from_name: name.trim(),
          from_email: email.trim(),
          rating: `${rating}`,
          suggestions: suggestions.trim(),
          to_email: "juliettenoel.xplania@gmail.com",
        },
        "g30bYpbP1x83gUEsQ"
      );
      setSending(false);
      setSent(true);
      toast.success("Merci pour votre feedback, vous contribuez à améliorer Xplania ✨");
    } catch {
      setSending(false);
      toast.error("Une erreur est survenue lors de l'envoi.");
    }
  };

  const handleClose = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) {
      setTimeout(() => {
        setSent(false);
        setName("");
        setEmail("");
        setSuggestions("");
        setRating(0);
      }, 300);
    }
  };

  if (sent) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="glass-card border-border">
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="w-16 h-16 rounded-full gradient-button flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground">Merci !</h3>
            <p className="text-sm text-muted-foreground text-center">
              Merci pour votre feedback, vous contribuez à améliorer Xplania ✨
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="glass-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <MessageSquare className="w-5 h-5 text-primary" />
            Donner mon feedback
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label className="text-foreground font-semibold">Nom</Label>
            <Input
              placeholder="Votre nom"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
              maxLength={100}
              required
            />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground font-semibold">Email</Label>
            <Input
              type="email"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
              maxLength={255}
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground font-semibold">Note</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-7 h-7 transition-colors ${
                      star <= (hoverRating || rating)
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="text-sm text-muted-foreground self-center ml-2">{rating}/5</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground font-semibold">Suggestions d'amélioration</Label>
            <Textarea
              placeholder="Partagez vos idées, suggestions ou retours..."
              value={suggestions}
              onChange={(e) => setSuggestions(e.target.value)}
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground min-h-[120px]"
              maxLength={1000}
              required
            />
          </div>
          <Button
            type="submit"
            disabled={sending}
            className="w-full gradient-button text-primary-foreground border-0"
          >
            <Send className="w-4 h-4 mr-2" />
            {sending ? "Envoi en cours..." : "Envoyer mon feedback"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackDialog;
