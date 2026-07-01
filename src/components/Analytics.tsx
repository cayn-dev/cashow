import { useEffect } from "react";
import { useLocation } from "react-router-dom";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function Analytics() {
  const location = useLocation();

  useEffect(() => {
    if (typeof window.gtag === "function") {
      const path = location.pathname + location.search;
      window.gtag("config", "G-Y67V7WQ2TG", { page_path: path });
    }
  }, [location.pathname, location.search]);

  return null;
}
