"use client";

import { useSyncExternalStore } from "react";

/** Même seuil que le split desktop/mobile déjà utilisé partout ailleurs
 * (`md:` de Tailwind = 768px) — `BranchLocator`, `BranchMap`, etc. décrivent
 * tous le même point de bascule. */
const DESKTOP_MEDIA_QUERY = "(min-width: 768px)";

function subscribe(callback: () => void): () => void {
  const mediaQueryList = window.matchMedia(DESKTOP_MEDIA_QUERY);
  mediaQueryList.addEventListener("change", callback);
  return () => mediaQueryList.removeEventListener("change", callback);
}

function getSnapshot(): boolean {
  return window.matchMedia(DESKTOP_MEDIA_QUERY).matches;
}

/** Toujours `false` côté serveur — évite tout mismatch d'hydratation ; le
 * client corrige dès le premier rendu si nécessaire (`useSyncExternalStore`
 * ré-invoque `getServerSnapshot`/`getSnapshot` de façon cohérente avec React). */
function getServerSnapshot(): boolean {
  return false;
}

/**
 * Décide, sans dépendance, si l'écran est en largeur "desktop" — utilisé par
 * `BranchMap` pour choisir entre `BranchPopup` en `InfoWindow` (desktop) et en
 * fiche fixe bas d'écran (mobile), §15.
 */
export function useIsDesktopViewport(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
