import type { OpeningHoursEntry } from "@/types/opening-hours";

/**
 * Gabarits d'horaires utilisés par les données DEMO (Phase 3 `prisma/seed-data.ts`)
 * et par toute fixture de développement qui a besoin des mêmes horaires sans
 * passer par Prisma (ex. vérification de la Phase 4 dans un environnement où
 * `prisma generate` est indisponible). Un vrai magasin importé plus tard
 * (Phase 10, CSV/Excel) aura ses propres `BranchOpeningHours` individuels — ce
 * gabarit ne sert qu'aux données de démonstration, jamais à un magasin réel.
 */
/**
 * "split" (Phase 7, §26) : coupure méridienne dim–jeu (07:00–13:30 puis
 * 16:00–22:00) — gabarit DEMO supplémentaire pour que les données de
 * démonstration couvrent réellement le cas des deux créneaux dans une
 * journée (`openingTime2`/`closingTime2`), pas seulement en test unitaire.
 */
export type HoursPattern = "standard" | "extended" | "split";

export function buildOpeningHoursFromPattern(pattern: HoursPattern): OpeningHoursEntry[] {
  const weekday =
    pattern === "extended"
      ? { openingTime: "07:00", closingTime: "23:00", openingTime2: null, closingTime2: null }
      : pattern === "split"
        ? { openingTime: "07:00", closingTime: "13:30", openingTime2: "16:00", closingTime2: "22:00" }
        : { openingTime: "07:00", closingTime: "22:00", openingTime2: null, closingTime2: null };
  const friday =
    pattern === "extended"
      ? { openingTime: "07:00", closingTime: "15:30" }
      : { openingTime: "07:00", closingTime: "15:00" };

  const weekdayEntries: OpeningHoursEntry[] = [0, 1, 2, 3, 4].map((dayOfWeek) => ({
    dayOfWeek: dayOfWeek as OpeningHoursEntry["dayOfWeek"],
    isClosed: false,
    openingTime: weekday.openingTime,
    closingTime: weekday.closingTime,
    openingTime2: weekday.openingTime2,
    closingTime2: weekday.closingTime2,
  }));

  return weekdayEntries.concat([
    {
      dayOfWeek: 5,
      isClosed: false,
      openingTime: friday.openingTime,
      closingTime: friday.closingTime,
      openingTime2: null,
      closingTime2: null,
    },
    {
      dayOfWeek: 6,
      isClosed: true,
      openingTime: null,
      closingTime: null,
      openingTime2: null,
      closingTime2: null,
    },
  ]);
}
