import { useCallback, useEffect, useState } from "react";

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if ("Notification" in window) setPermission(Notification.permission);
  }, []);

  const request = useCallback(async () => {
    if (!("Notification" in window)) return "denied" as NotificationPermission;
    const p = await Notification.requestPermission();
    setPermission(p);
    return p;
  }, []);

  const notify = useCallback((title: string, body?: string) => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    try { new Notification(title, { body, icon: "/favicon.ico" }); } catch {}
  }, []);

  return { permission, request, notify };
}
