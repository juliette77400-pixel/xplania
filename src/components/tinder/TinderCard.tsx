import { motion, PanInfo, useMotionValue, useTransform } from "framer-motion";
import { Heart, X } from "lucide-react";

export interface TinderCardData {
  id: string;
  image_url: string | null;
  phrase: string;
}

interface Props {
  card: TinderCardData;
  onSwipe: (direction: "right" | "left") => void;
  isTop: boolean;
}

const SWIPE_THRESHOLD = 120;

export default function TinderCard({ card, onSwipe, isTop }: Props) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-250, 0, 250], [-18, 0, 18]);
  const likeOpacity = useTransform(x, [40, 160], [0, 1]);
  const nopeOpacity = useTransform(x, [-160, -40], [1, 0]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > SWIPE_THRESHOLD || info.velocity.x > 500) onSwipe("right");
    else if (info.offset.x < -SWIPE_THRESHOLD || info.velocity.x < -500) onSwipe("left");
  };

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
      whileTap={{ cursor: "grabbing" }}
    >
      <div className="relative h-full w-full overflow-hidden rounded-3xl border border-border/40 shadow-[0_20px_60px_hsl(var(--primary)/.15)] bg-card">
        {card.image_url ? (
          <img src={card.image_url} alt="" className="h-full w-full object-cover" draggable={false} />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/30 via-secondary/20 to-background" />
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
          <p className="text-2xl font-extrabold leading-tight text-white sm:text-3xl drop-shadow-lg">
            {card.phrase}
          </p>
        </div>

        <motion.div
          style={{ opacity: likeOpacity }}
          className="pointer-events-none absolute left-6 top-6 rotate-[-12deg] rounded-xl border-4 border-green-400 px-4 py-2 text-2xl font-black text-green-400"
        >
          <Heart className="inline h-6 w-6 mr-2" /> OUI
        </motion.div>
        <motion.div
          style={{ opacity: nopeOpacity }}
          className="pointer-events-none absolute right-6 top-6 rotate-[12deg] rounded-xl border-4 border-rose-400 px-4 py-2 text-2xl font-black text-rose-400"
        >
          <X className="inline h-6 w-6 mr-2" /> NON
        </motion.div>
      </div>
    </motion.div>
  );
}
