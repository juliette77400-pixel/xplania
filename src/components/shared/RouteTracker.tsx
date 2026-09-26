import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { track } from "@/lib/analytics";

/** Fires a `page_view` analytics event whenever the route changes. */
const RouteTracker = () => {
  const location = useLocation();

  useEffect(() => {
    track("page_view", { search: location.search || undefined });
  }, [location.pathname, location.search]);

  return null;
};

export default RouteTracker;
