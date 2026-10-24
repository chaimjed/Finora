// components/dashboard/useIsDark.ts
import { useEffect, useState } from "react";

const hasDarkClass = () =>
  typeof document !== "undefined" &&
  document.documentElement.classList.contains("dark");

export function useIsDark(): boolean {
  const [dark, setDark] = useState<boolean>(hasDarkClass);

  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => setDark(hasDarkClass()));
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    setDark(hasDarkClass());
    return () => observer.disconnect();
  }, []);

  return dark;
}