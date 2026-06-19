import { Lock, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BadgeWithClaim } from "@/hooks/useGamification";

interface Props {
  badge: BadgeWithClaim;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
}

const SIZE_CLASSES = {
  sm: "w-14 h-14 text-2xl",
  md: "w-20 h-20 text-3xl",
  lg: "w-28 h-28 text-5xl",
};

/**
 * BadgeMedal — circular medal with category gradient + icon + state.
 * No external photo, palette per category, accessible.
 */
const BadgeMedal = ({ badge, size = "md", onClick }: Props) => {
  const { category, status, icon } = badge;
  const from = category?.gradient_from || "#057dcd";
  const to = category?.gradient_to || "#9138c8";
  const iconChar = icon || category?.icon || "🏅";

  const isValidated = status === "validated";
  const isSubmitted = status === "submitted";
  const isRejected = status === "rejected";
  const isInProgress = status === "in_progress";
  const isLocked = status === "locked";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={badge.name_fr}
      className={cn(
        "relative rounded-full flex items-center justify-center shrink-0 transition-transform",
        "ring-2 ring-offset-2 ring-offset-background",
        SIZE_CLASSES[size],
        isValidated && "hover:scale-105 ring-emerald-400/60 shadow-[0_0_20px_rgba(16,185,129,0.35)]",
        isSubmitted && "ring-amber-400/60 animate-pulse",
        isInProgress && "ring-primary/40",
        isRejected && "ring-red-500/60",
        isLocked && "ring-border grayscale opacity-60 hover:opacity-80",
        onClick && "cursor-pointer",
      )}
      style={{
        background: isLocked
          ? "linear-gradient(135deg, hsl(var(--muted)), hsl(var(--card)))"
          : `linear-gradient(135deg, ${from}, ${to})`,
      }}
    >
      <span className="select-none drop-shadow-[0_2px_3px_rgba(0,0,0,0.3)]" aria-hidden>
        {iconChar}
      </span>

      {isLocked && (
        <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
          <Lock className="w-3 h-3 text-muted-foreground" />
        </span>
      )}
      {isValidated && (
        <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-background flex items-center justify-center">
          <CheckCircle2 className="w-4 h-4 text-white" />
        </span>
      )}
      {isSubmitted && (
        <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500 border-2 border-background flex items-center justify-center">
          <Clock className="w-3.5 h-3.5 text-white" />
        </span>
      )}
      {isRejected && (
        <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-red-500 border-2 border-background flex items-center justify-center">
          <AlertCircle className="w-3.5 h-3.5 text-white" />
        </span>
      )}
    </button>
  );
};

export default BadgeMedal;
