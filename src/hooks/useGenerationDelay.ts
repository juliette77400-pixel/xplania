import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

const MAX_DELAY_MS = 10_000;

export function randomGenerationDelay(random: () => number = Math.random): number {
  return Math.floor(random() * (MAX_DELAY_MS + 1));
}

/** Adds a cancellable jitter immediately before an AI request, never before saved-result reads. */
export function useGenerationDelay() {
  const { t } = useTranslation();
  const [waiting, setWaiting] = useState(false);
  const mounted = useRef(true);
  const pending = useRef<AbortController | null>(null);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      pending.current?.abort();
    };
  }, []);

  const wait = useCallback((): Promise<boolean> => {
    // A second click during the jitter never creates another request.
    if (pending.current) return Promise.resolve(false);

    const controller = new AbortController();
    pending.current = controller;
    setWaiting(true);
    const toastId = toast.loading(t("common.generationDelay"));

    return new Promise<boolean>((resolve) => {
      let settled = false;
      const finish = (proceed: boolean) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        controller.signal.removeEventListener("abort", onAbort);
        toast.dismiss(toastId);
        if (pending.current === controller) pending.current = null;
        if (mounted.current) setWaiting(false);
        resolve(proceed);
      };
      const onAbort = () => finish(false);
      const timer = window.setTimeout(() => finish(true), randomGenerationDelay());
      controller.signal.addEventListener("abort", onAbort, { once: true });
    });
  }, [t]);

  return { waiting, wait };
}
