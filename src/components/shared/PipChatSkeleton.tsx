import { Sparkles } from "lucide-react";

/**
 * Placeholder for the floating global Pip chat while its chunk loads.
 * Mirrors the launcher's position so layout doesn't shift when it mounts.
 */
const PipChatSkeleton = () => (
  <div
    aria-hidden
    className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full gradient-button shadow-lg flex items-center justify-center opacity-70 animate-pulse pointer-events-none"
  >
    <Sparkles className="w-6 h-6 text-primary-foreground" />
  </div>
);

export default PipChatSkeleton;
