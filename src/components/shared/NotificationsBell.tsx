import { Bell, Check } from "lucide-react";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useInAppNotifications } from "@/hooks/useInAppNotifications";
import { useNotifications } from "@/hooks/useNotifications";
import { loadPrefs } from "@/lib/user-prefs";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { fr, enUS } from "date-fns/locale";

const NotificationsBell = () => {
  const { items, unreadCount, markAllRead } = useInAppNotifications();
  const { t, i18n } = useTranslation();
  const { notify } = useNotifications();
  const locale = i18n.language.startsWith("fr") ? fr : enUS;
  const seenIdsRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);

  // Surface new notifications via toast + browser push (when user opted in).
  useEffect(() => {
    if (!items.length) return;
    const prefs = loadPrefs();
    if (!initializedRef.current) {
      items.forEach((n) => seenIdsRef.current.add(n.id));
      initializedRef.current = true;
      return;
    }
    items.forEach((n) => {
      if (seenIdsRef.current.has(n.id)) return;
      seenIdsRef.current.add(n.id);
      if (!n.read_at) {
        if (prefs.notifyInApp) {
          toast(n.title, { description: n.body || undefined });
        }
        if (prefs.notifyBrowser) notify(n.title, n.body || undefined);
      }
    });
  }, [items, notify]);

  return (
    <Popover>
      <PopoverTrigger
        aria-label={t("notifBell.aria")}
        className="relative p-2 rounded-lg hover:bg-muted transition-colors"
      >
        <Bell className="w-4 h-4 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border p-3">
          <p className="text-sm font-semibold">{t("notifBell.title")}</p>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1 text-[11px] text-primary hover:underline"
            >
              <Check className="w-3 h-3" /> {t("notifBell.markAll")}
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
              {t("notifBell.empty")}
            </div>
          ) : (
            items.map((n) => (
              <div
                key={n.id}
                className={`p-3 border-b border-border last:border-0 hover:bg-muted/40 transition-colors ${
                  !n.read_at ? "bg-primary/5" : ""
                }`}
              >
                <div className="flex items-start gap-2">
                  {!n.read_at && (
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{n.title}</p>
                    {n.body && (
                      <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{n.body}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(n.sent_at), { addSuffix: true, locale })}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationsBell;
