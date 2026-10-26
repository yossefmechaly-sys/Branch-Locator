import { OPENING_HOURS_TIMEZONE } from "@/lib/opening-hours/config";
import { getIsraelNow } from "@/lib/opening-hours/timezone";

/**
 * Fuseau horaire des statistiques métier (Phase 10, §18) — TOUJOURS
 * `Asia/Jerusalem`, JAMAIS UTC ni le fuseau du serveur. Réutilise
 * délibérément la constante et la fonction `getIsraelNow()` déjà validées par
 * le moteur d'horaires (Phase 7) plutôt que de redéfinir un second "Asia/
 * Jerusalem" ou une seconde conversion `Intl` — un seul point de vérité pour
 * tout le projet.
 *
 * Cette phase agrège en TypeScript après une seule requête Prisma filtrée
 * par plage UTC (voir `jerusalemDateRangeToUtc`), plutôt qu'un `GROUP BY`
 * SQL avec conversion de fuseau — Prisma ne permet pas d'exprimer
 * `AT TIME ZONE` sans repasser par du SQL brut (`$queryRaw`), que le reste du
 * projet n'utilise nulle part ailleurs. Raisonnable au volume actuel (§8 :
 * "évite l'optimisation prématurée") ; si le volume d'événements grandit
 * significativement, la prochaine étape naturelle est une table d'agrégats
 * quotidiens pré-calculée (§8), pas une réécriture immédiate en SQL brut.
 */
export { OPENING_HOURS_TIMEZONE as ANALYTICS_TIMEZONE };

/** Jour calendaire ("YYYY-MM-DD") à Jérusalem d'un instant absolu — pur
 * wrapper de lisibilité autour de `getIsraelNow()` pour les appelants
 * analytics, qui n'ont besoin que de cette seule partie (pas
 * `dayOfWeek`/`minutesSinceMidnight`, propres au moteur d'horaires). */
export function jerusalemIsoDate(instant: Date): string {
  return getIsraelNow(instant).isoDate;
}

/** Décalage (en minutes) d'un fuseau IANA par rapport à UTC, à un instant
 * donné — technique standard sans dépendance : on relit, via `Intl`, les
 * composants de date/heure que `instant` affiche dans `timeZone`, on les
 * réinterprète comme s'ils étaient déjà UTC, et la différence avec `instant`
 * est exactement ce décalage. Gère nativement l'heure d'été (DST) puisque
 * `Intl` connaît les règles réelles de `Asia/Jerusalem`. */
function timezoneOffsetMinutes(instant: Date, timeZone: string): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = formatter.formatToParts(instant);
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)?.value ?? 0);

  const asIfUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return Math.round((asIfUtc - instant.getTime()) / 60_000);
}

/** Instant UTC correspondant à MINUIT à Jérusalem pour un jour calendaire
 * "YYYY-MM-DD" donné — l'inverse de `jerusalemIsoDate()`. Utilisée pour
 * traduire une plage de dates "métier" (choisie par l'admin en heure de
 * Jérusalem) en bornes `createdAt` UTC pour la requête Prisma. */
export function jerusalemMidnightToUtc(isoDate: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  const utcMidnightGuess = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  const offsetMinutes = timezoneOffsetMinutes(utcMidnightGuess, OPENING_HOURS_TIMEZONE);
  return new Date(utcMidnightGuess.getTime() - offsetMinutes * 60_000);
}

/** Ajoute `days` jours calendaires à une date "YYYY-MM-DD" (peut être
 * négatif) — arithmétique pure sur les composants, jamais sur une heure
 * murale (DST-safe), même principe que `lib/opening-hours/timezone.ts#addIsoDays`. */
export function addIsoDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/**
 * Traduit une plage de dates calendaires INCLUSIVE, en heure de Jérusalem
 * (§18), en bornes UTC `[gte, lt)` prêtes pour `prisma.analyticsEvent.findMany`.
 */
export function jerusalemDateRangeToUtc(startIsoDate: string, endIsoDateInclusive: string): { gte: Date; lt: Date } {
  return {
    gte: jerusalemMidnightToUtc(startIsoDate),
    lt: jerusalemMidnightToUtc(addIsoDays(endIsoDateInclusive, 1)),
  };
}

/** Nombre de jours calendaires INCLUSIFS entre deux dates "YYYY-MM-DD"
 * (ex. même jour → 1, un jour d'écart → 2). */
export function inclusiveDayCount(startIsoDate: string, endIsoDateInclusive: string): number {
  const toUtcMs = (isoDate: string) => {
    const [year, month, day] = isoDate.split("-").map(Number);
    return Date.UTC(year, month - 1, day);
  };
  return Math.round((toUtcMs(endIsoDateInclusive) - toUtcMs(startIsoDate)) / 86_400_000) + 1;
}

/** Période précédente de MÊME durée, immédiatement avant `startIsoDate`
 * (§17) — ex. "7 derniers jours" (01→07) donne "7 jours avant" (25 juin→30
 * juin inclus... c.-à-d. les 7 jours précédant le 1er directement, sans
 * chevauchement ni trou). */
export function previousPeriod(
  startIsoDate: string,
  endIsoDateInclusive: string
): { start: string; end: string } {
  const days = inclusiveDayCount(startIsoDate, endIsoDateInclusive);
  const end = addIsoDays(startIsoDate, -1);
  const start = addIsoDays(end, -(days - 1));
  return { start, end };
}
