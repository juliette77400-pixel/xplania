import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Camera, Loader2, ImageOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export interface UnsplashPhoto {
  id: string;
  url: string;
  fullUrl: string;
  thumb: string;
  alt: string;
  photographer: string;
  photographerUrl?: string;
  link?: string;
}

interface PhotoGalleryProps {
  query: string;
  perPage?: number;
}

const PhotoGallery = ({ query, perPage = 6 }: PhotoGalleryProps) => {
  const [photos, setPhotos] = useState<UnsplashPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query || query.trim().length < 2) return;
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fnError } = await supabase.functions.invoke("unsplash", {
          body: { query, perPage },
        });
        if (fnError) throw fnError;
        if (data?.error) throw new Error(data.error);
        if (!cancelled) setPhotos((data?.photos as UnsplashPhoto[]) || []);
      } catch (e: any) {
        console.error("Unsplash fetch error:", e);
        if (!cancelled) setError("Impossible de charger les photos pour cette ville.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [query, perPage]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-6"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
          <Camera className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-base font-bold text-foreground">Photos de {query}</h3>
          <p className="text-xs text-muted-foreground">Images réelles via Unsplash</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-3 py-10">
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Chargement des photos…</p>
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10">
          <ImageOff className="w-5 h-5 text-destructive shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      ) : photos.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">
          Aucune photo trouvée pour cette ville.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photos.map((p) => (
            <a
              key={p.id}
              href={p.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative rounded-xl overflow-hidden bg-muted aspect-[4/3] block"
            >
              <img
                src={p.url}
                alt={p.alt}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/95 via-background/40 to-transparent p-2">
                <p className="text-[10px] text-foreground/90 truncate">
                  Photo by{" "}
                  {p.photographerUrl ? (
                    <a
                      href={p.photographerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {p.photographer}
                    </a>
                  ) : (
                    <span className="text-primary">{p.photographer}</span>
                  )}{" "}
                  on Unsplash
                </p>
              </div>
            </a>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default PhotoGallery;
