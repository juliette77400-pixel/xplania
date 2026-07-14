import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

interface DialogSkeletonProps {
  /** Approximate size of the target dialog so the placeholder feels right. */
  size?: "sm" | "md" | "lg";
  /** Show a compact one-line skeleton instead of a full body. */
  compact?: boolean;
}

/**
 * Lightweight, animated placeholder rendered while a lazy-loaded dialog's
 * chunk is being fetched. Keeps the modal shell + backdrop consistent so the
 * transition into the real dialog feels instant.
 */
const DialogSkeleton = ({ size = "md", compact = false }: DialogSkeletonProps) => {
  const maxW = size === "lg" ? "max-w-2xl" : size === "sm" ? "max-w-sm" : "max-w-md";
  return (
    <Dialog open>
      <DialogContent
        className={`${maxW} glass-card border-border`}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div className="flex items-center gap-3 pb-2">
          <div className="w-10 h-10 rounded-xl gradient-button flex items-center justify-center shrink-0">
            <Loader2 className="w-5 h-5 text-primary-foreground animate-spin" />
          </div>
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
        {!compact && (
          <div className="space-y-3 py-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-24 w-full rounded-lg" />
            <div className="flex justify-end gap-2 pt-2">
              <Skeleton className="h-9 w-20 rounded-md" />
              <Skeleton className="h-9 w-28 rounded-md" />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DialogSkeleton;
