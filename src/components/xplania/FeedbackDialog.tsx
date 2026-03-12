import { useState } from "react";
import emailjs from "@emailjs/browser";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MessageSquare, Send, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FeedbackDialog = ({ open, onOpenChange }: Props) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    try {
      await emailjs.send(
        "service_23bwf9g",
        "template_206dhup",
        {
          from_name: name.trim(),
          from_email: email.trim(),
          message: message.trim(),
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

    setTimeout(() => {
      onOpenChange(false);
      setSent(false);
      setName("");
      setEmail("");
      setMessage("");
    }, 2000);
  };

  if (sent) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="glass-card border-border">
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="w-16 h-16 rounded-full gradient-button flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground">Merci !</h3>
            <p className="text-sm text-muted-foreground text-center">
              Votre feedback a bien été envoyé. Il nous aide à améliorer Xplania.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            <Label className="text-foreground font-semibold">Message</Label>
            <Textarea
              placeholder="Partagez vos idées, suggestions ou retours..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
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
            {sending ? "Envoi en cours..." : "Envoyer"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackDialog;
