import { useEffect, useState } from "react";
import { resolveDestinationImage, resolvePlaceImage, heroImage, activityImage } from "@/lib/unsplash";

/** Renvoie une URL d'image pour une destination, upgradée via Wikipedia si dispo. */
export const useDestinationImage = (destination: string, w = 1600, h = 600) => {
  const fallback = heroImage(destination, w, h);
  const [src, setSrc] = useState(fallback);

  useEffect(() => {
    setSrc(heroImage(destination, w, h));
    if (!destination) return;
    let cancelled = false;
    resolveDestinationImage(destination).then((url) => {
      if (!cancelled && url) setSrc(url);
    });
    return () => {
      cancelled = true;
    };
  }, [destination, w, h]);

  return src;
};

/** Renvoie une URL d'image pour un lieu (ex: activité) dans une destination. */
export const usePlaceImage = (
  destination: string,
  query: string,
  w = 480,
  h = 280,
) => {
  const fallback = activityImage(destination, query, w, h);
  const [src, setSrc] = useState(fallback);

  useEffect(() => {
    setSrc(activityImage(destination, query, w, h));
    if (!destination && !query) return;
    let cancelled = false;
    resolvePlaceImage(destination, query).then((url) => {
      if (!cancelled && url) setSrc(url);
    });
    return () => {
      cancelled = true;
    };
  }, [destination, query, w, h]);

  return src;
};
