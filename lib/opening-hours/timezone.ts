import type { DayOfWeek } from "@/types/opening-hours";
import { OPENING_HOURS_TIMEZONE } from "./config";

/**
 * Utilitaires date/heure du moteur d'horaires (Phase 7, §11) — toujours basés
 * sur `Intl.DateTimeFormat` avec un fuseau EXPLICITE (`Asia/Jerusalem`),
 * jamais sur `Date.getHours()`/`Date.getDay()` (qui liraient le fuseau du
 * processus Node — souvent UTC en production — ou celui du navigateur côté
 * client). Aucune bibliothèque date/heure tierce : `Intl` suffit entièrement
 * ici et évite d'alourdir le bundle pour un besoin aussi ciblé.
 *
 * Une fois qu'on a obtenu la date calendaire correcte à Jérusalem (via
 * `Intl`), toute arithmétique de date SUIVANTE (jour suivant, jour de la
 * semaine) est faite en UTC pur sur ces seuls composants année/mois/jour —
 * jamais sur une heure « murale » — ce qui la rend automatiquement insensible
 * au changement d'heure (DST) : ajouter un jour calendaire ne dépend jamais
 * de la durée réelle en heures de ce jour-là.
 */

const WEEKDAY_TO_DAY_OF_WEEK: Record<string, DayOfWeek> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/** Format strict "HH:mm" (24h) — toute autre chaîne est considérée invalide
 * et ignorée par le reste du moteur (§12 : tolérance aux données invalides,
 * jamais de plantage). */
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export interface IsraelNow {
  dayOfWeek: DayOfWeek;
  minutesSinceMidnight: number;
  /** "YYYY-MM-DD" dans le fuseau Asia/Jerusalem — comparé à `SpecialOpeningHours.date`. */
  isoDate: string;
}

/** Heure « maintenant » en Israël, à partir d'un instant UTC absolu quelconque
 * (`Date` — un timestamp, pas une heure murale). Fonction fondatrice de tout
 * le moteur : chaque autre fonction de `lib/opening-hours/` en dérive son
 * `isoDate`/`dayOfWeek`/`minutesSinceMidnight`, jamais recalculés autrement. */
export function getIsraelNow(referenceDate: Date): IsraelNow {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: OPENING_HOURS_TIMEZONE,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(referenceDate);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  const dayOfWeek = WEEKDAY_TO_DAY_OF_WEEK[get("weekday")] ?? 0;
  const minutesSinceMidnight = Number(get("hour")) * 60 + Number(get("minute"));
  const isoDate = `${get("year")}-${get("month")}-${get("day")}`;

  return { dayOfWeek, minutesSinceMidnight, isoDate };
}

/** Convertit une date calendaire "YYYY-MM-DD" en `Date` UTC à minuit — jamais
 * interprétée comme une heure murale locale, uniquement comme des composants
 * de date pour l'arithmétique ci-dessous (DST-safe, §11). */
function isoDateToUtcMidnight(isoDate: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/** Ajoute `days` jours CALENDAIRES à une date "YYYY-MM-DD" (peut être négatif).
 * Utilisé par `getNextOpeningTime()` pour avancer jour par jour sans jamais
 * dépendre de la durée réelle en heures d'une journée avec DST (§8/§11). */
export function addIsoDays(isoDate: string, days: number): string {
  const date = isoDateToUtcMidnight(isoDate);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Jour de la semaine (0 = dimanche) d'une date "YYYY-MM-DD" — dérivé
 * uniquement des composants calendaires, jamais de la conversion vers une
 * heure locale. */
export function dayOfWeekForIsoDate(isoDate: string): DayOfWeek {
  return isoDateToUtcMidnight(isoDate).getUTCDay() as DayOfWeek;
}

/** "HH:mm" → minutes depuis minuit, ou `null` si le format est invalide (§12 :
 * tolérance — jamais de `NaN` propagé silencieusement dans le reste du
 * moteur). */
export function timeToMinutes(time: string | null | undefined): number | null {
  if (!time || !TIME_PATTERN.test(time)) return null;
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function isValidTimeString(time: string | null | undefined): time is string {
  return typeof time === "string" && TIME_PATTERN.test(time);
}
