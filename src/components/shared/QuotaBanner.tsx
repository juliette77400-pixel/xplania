import { Sparkles, Lock } from "lucide-react";
import { type QuotaTool, getRemaining, getLimit } from "@/lib/usage-quota";

interface Props {
  tool: QuotaTool;
  toolLabel: string;
}

const QuotaBanner = ({ tool, toolLabel }: Props) => {
  const remaining = getRemaining(tool);
  const limit = getLimit(tool);

  if (remaining <= 0) {
    return (
      <div className="mx-auto max-w-5xl px-4 mb-4">
        <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3">
          <Lock className="w-4 h-4 text-destructive shrink-0" />
          <p className="text-sm text-foreground">
            Tu as utilisé tes <strong>{limit} générations gratuites</strong> pour {toolLabel}.{" "}
            <a href="/offres" className="text-primary hover:underline font-semibold">Passer à Plus →</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 mb-4">
      <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5">
        <Sparkles className="w-4 h-4 text-primary shrink-0" />
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{remaining}/{limit}</span> génération{remaining > 1 ? "s" : ""} gratuite{remaining > 1 ? "s" : ""} restante{remaining > 1 ? "s" : ""} pour {toolLabel}
        </p>
      </div>
    </div>
  );
};

export default QuotaBanner;
