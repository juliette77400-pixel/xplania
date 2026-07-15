import { useState } from "react";
import { motion, PanInfo, useMotionValue, useTransform } from "framer-motion";
import { Heart, X } from "lucide-react";
import type { CategoryDef } from "@/lib/tinder-categories";

export interface TinderCardData {
  id: string;
  image_url: string | null;
  phrase: string;
}

interface Props {
  card: TinderCardData;
  onSwipe: (direction: "right" | "left") => void;
  isTop: boolean;
  category?: CategoryDef;
}

const SWIPE_THRESHOLD = 120;

export default function TinderCard({ card, onSwipe, isTop, category }: Props) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-250, 0, 250], [-18, 0, 18]);
  const likeOpacity = useTransform(x, [40, 160], [0, 1]);
  const nopeOpacity = useTransform(x, [-160, -40], [1, 0]);
  // Full-card colored tint that intensifies as the user drags — makes intent clear before release.
  const likeTint = useTransform(x, [0, 200], [0, 0.35]);
  const nopeTint = useTransform(x, [-200, 0], [0.35, 0]);

  const [exitDir, setExitDir] = useState<"left" | "right" | null>(null);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > SWIPE_THRESHOLD || info.velocity.x > 500) {
      setExitDir("right");
      onSwipe("right");
    } else if (info.offset.x < -SWIPE_THRESHOLD || info.velocity.x < -500) {
      setExitDir("left");
      onSwipe("left");
    }
  };

  const CatIcon = category?.Icon;

  return (
    <motion.div
      className="absolute inset-0 select-none touch-none"
      style={{ x, rotate, zIndex: isTop ? 2 : 1 }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      initial={{ scale: isTop ? 1 : 0.94, y: isTop ? 0 : 20, opacity: isTop ? 1 : 0.9 }}
      animate={{ scale: isTop ? 1 : 0.94, y: isTop ? 0 : 20, opacity: isTop ? 1 : 0.9 }}
      exit={{
        x: exitDir === "right" ? 700 : exitDir === "left" ? -700 : 0,
        opacity: 0,
        rotate: exitDir === "right" ? 28 : exitDir === "left" ? -28 : 0,
        transition: { duration: 0.35, ease: [0.22, 0.9, 0.32, 1] },
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      whileTap={{ cursor: "grabbing" }}
    >
      <div
        className={`relative h-full w-full overflow-hidden rounded-3xl border shadow-[0_20px_60px_hsl(var(--primary)/.15)] bg-card ${
          category?.border ?? "border-border/40"
        }`}
      >
        {card.image_url ? (
          <img src={card.image_url} alt="" className="h-full w-full object-cover" draggable={false} />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/30 via-secondary/20 to-background" />
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

        {/* Full-card intent tints — grow with drag distance */}
        {isTop && (
          <>
            <motion.div
              style={{ opacity: likeTint }}
              className="pointer-events-none absolute inset-0 bg-green-500 mix-blend-multiply"
            />
            <motion.div
              style={{ opacity: nopeTint }}
              className="pointer-events-none absolute inset-0 bg-rose-500 mix-blend-multiply"
            />
          </>
        )}

        {category && CatIcon && (
          <div
            className={`absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border ${category.border} ${category.chipBg} px-2.5 py-1 text-[11px] font-semibold ${category.accent} backdrop-blur-md`}
          >
            <CatIcon className="h-3.5 w-3.5" />
            <span className="uppercase tracking-wide">{category.fallback}</span>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
          <p className="text-2xl font-extrabold leading-tight text-white sm:text-3xl drop-shadow-lg">
            {card.phrase}
          </p>
        </div>

        <motion.div
          style={{ opacity: likeOpacity }}
          className="pointer-events-none absolute right-6 top-6 rotate-[12deg] rounded-xl border-4 border-green-400 px-4 py-2 text-2xl font-black text-green-400"
        >
          <Heart className="inline h-6 w-6 mr-2" /> OUI
        </motion.div>
        <motion.div
          style={{ opacity: nopeOpacity }}
          className="pointer-events-none absolute left-6 top-6 rotate-[-12deg] rounded-xl border-4 border-rose-400 px-4 py-2 text-2xl font-black text-rose-400"
        >
          <X className="inline h-6 w-6 mr-2" /> NON
        </motion.div>
      </div>
    </motion.div>
  );
}
