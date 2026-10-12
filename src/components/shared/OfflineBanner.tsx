import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { WifiOff } from "lucide-react";

/** Small fixed banner shown when the device loses its internet connection. */
const OfflineBanner = () => {
  const { t } = useTranslation();
  const [offline, setOffline] = useState(typeof navigator !== "undefined" && !navigator.onLine);
  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  if (!offline) return null;
  return (
    <div role="status" className="fixed top-2 left-1/2 z-[100] -translate-x-1/2 flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground shadow-lg">
      <WifiOff className="h-4 w-4 text-primary" aria-hidden />
      {t("offlineBanner.text")}
    </div>
  );
};

export default OfflineBanner;
