"use client";

import { useEffect, useState } from "react";

/** Renvoie `value`, mais mis à jour seulement `delayMs` après le dernier changement. */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
