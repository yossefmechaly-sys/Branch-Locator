import type { DayOfWeek, OpeningHoursEntry } from "@/types/opening-hours";
import { normalizeOpeningHours } from "@/lib/opening-hours/normalize";
import { getSlotsForSource } from "@/lib/opening-hours/slots";

/**
 * `dayOfWeek` Schema.org attend une URI (`https://schema.org/Sunday`, etc.) —
 * table de correspondance avec la convention interne `DayOfWeek`
 * (0 = dimanche, `types/opening-hours.ts`, Phase 3/7).
 */
const SCHEMA_DAY_OF_WEEK: Record<DayOfWeek, string> = {
  0: "https://schema.org/Sunday",
  1: "https://schema.org/Monday",
  2: "https://schema.org/Tuesday",
  3: "https://schema.org/Wednesday",
  4: "https://schema.org/Thursday",
  5: "https://schema.org/Friday",
  6: "https://schema.org/Saturday",
};

export interface OpeningHoursSpecificationSchema {
  "@type": "OpeningHoursSpecification";
  dayOfWeek: string;
  opens: string;
  closes: string;
}

/**
 * Transforme les horaires hebdomadaires en `OpeningHoursSpecification`
 * Schema.org (Phase 8, §24) — réutilise EXACTEMENT `normalizeOpeningHours()`
 * et `getSlotsForSource()` (moteur Phase 7) plutôt que de reparser les heures
 * soi-même (§8 : « ne recrée aucune logique horaire »). Une entrée par
 * créneau valide : un jour à coupure méridienne produit DEUX
 * `OpeningHoursSpecification` (support des créneaux fractionnés, §24).
 *
 * Un jour fermé, absent, ou dont tous les créneaux sont invalides ne produit
 * simplement AUCUNE entrée — jamais une entrée avec `opens`/`closes` vides ou
 * incohérents (§24 : « ne publier que des valeurs valides »).
 *
 * Volontairement LIMITÉ aux horaires HEBDOMADAIRES normaux : les horaires
 * spéciaux (`SpecialOpeningHours` — veilles de fête, fermetures
 * exceptionnelles, jours fériés) ne sont PAS encodés ici. Schema.org prévoit
 * bien un mécanisme d'exception (`validFrom`/`validThrough` sur une
 * `OpeningHoursSpecification` dédiée), mais son support par les moteurs de
 * recherche est inégal et son encodage correct pour un horaire "fermé ce
 * jour-là précisément" est délicat à garantir toujours valide. Plutôt que de
 * risquer un JSON-LD incohérent certains jours (§24 : « les horaires spéciaux
 * ne doivent pas rendre le JSON-LD invalide »), ce module n'émet QUE des
 * horaires hebdomadaires garantis valides par construction — limite
 * documentée, pas une implémentation fragile.
 */
export function buildOpeningHoursSpecification(
  openingHours: readonly OpeningHoursEntry[]
): OpeningHoursSpecificationSchema[] {
  const normalized = normalizeOpeningHours(openingHours);
  const specs: OpeningHoursSpecificationSchema[] = [];

  for (const entry of normalized) {
    if (entry.isClosed) continue;
    for (const slot of getSlotsForSource(entry)) {
      specs.push({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: SCHEMA_DAY_OF_WEEK[entry.dayOfWeek],
        opens: slot.openingTimeRaw,
        closes: slot.closingTimeRaw,
      });
    }
  }

  return specs;
}
