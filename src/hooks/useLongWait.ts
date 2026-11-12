import { useEffect, useState } from "react";

/** An informational timer only: never abort or repeat work that is still running. */
export function useLongWait(pending: boolean) {
  const [long, setLong] = useState(false);
  useEffect(() => {
    setLong(false);
    if (!pending) return;
    const timer = window.setTimeout(() => setLong(true), 15_000);
    return () => window.clearTimeout(timer);
  }, [pending]);
  return pending && long;
}