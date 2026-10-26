/**
 * Types du moteur d'horaires, implémenté en `lib/opening-hours/status.ts` (Phase 4,
 * en avance sur le plan initial de Phase 7 pour que `BranchCard`/`BranchStatus`
 * puissent afficher un vrai statut ouvert/fermé dès cette phase).
 */

/** 0 = dimanche … 6 = samedi — convention israélienne, cohérente avec le seed. */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Heure au format "HH:mm" (chaîne, pas de `Date` — indépendant du fuseau). */
export type TimeString = `${number}:${number}` | string;

export interface OpeningHoursEntry {
  dayOfWeek: DayOfWeek;
  isClosed: boolean;
  openingTime: TimeString | null;
  closingTime: TimeString | null;
  /** Second créneau optionnel (coupure méridienne, etc.). */
  openingTime2: TimeString | null;
  closingTime2: TimeString | null;
}

export interface SpecialHoursEntry {
  /** Date ISO "YYYY-MM-DD", comparée dans le fuseau Asia/Jerusalem. */
  date: string;
  title: string | null;
  isClosed: boolean;
  openingTime: TimeString | null;
  closingTime: TimeString | null;
  openingTime2: TimeString | null;
  closingTime2: TimeString | null;
}

/**
 * Statuts renvoyés par `getBranchStatus()` (§19 du cahier des charges).
 * `TEMPORARILY_CLOSED` est indépendant des horaires (drapeau administratif, ex.
 * jour férié déclaré fermé) — distinct de `CLOSED`, qui reflète simplement les
 * horaires du jour (hebdomadaires ou spéciaux).
 */
export type BranchStatus =
  | "OPEN"
  | "CLOSED"
  | "OPENING_SOON"
  | "CLOSING_SOON"
  | "TEMPORARILY_CLOSED";

/** Horaires du jour courant, tels qu'affichés dans `BranchStatus`/`BranchCard`. */
export interface TodayHours {
  openingTime: TimeString | null;
  closingTime: TimeString | null;
  /** Second créneau optionnel (coupure méridienne). */
  openingTime2: TimeString | null;
  closingTime2: TimeString | null;
}

/** Résultat complet de `getBranchStatus()`. */
export interface BranchStatusResult {
  status: BranchStatus;
  /** `null` si le magasin est fermé toute la journée (jour de repos ou jour spécial fermé). */
  todayHours: TodayHours | null;
  /** `true` si le statut du jour provient d'un `SpecialOpeningHours` plutôt que des horaires hebdomadaires. */
  isSpecialDay: boolean;
  specialDayTitle: string | null;
  /** Minutes avant le prochain changement (ouverture ou fermeture), quand il est connu. */
  minutesUntilChange: number | null;
}

/** Résultat de `getOpeningHoursForDate()`/`getTodayOpeningHours()` (Phase 7, §8/§13). */
export interface OpeningHoursForDateResult {
  isoDate: string;
  dayOfWeek: DayOfWeek;
  /** `true` si le magasin est fermé toute la journée (jour de repos, fermeture
   * exceptionnelle, ou donnée absente/invalide). */
  isClosed: boolean;
  /** `null` si `isClosed`. */
  hours: TodayHours | null;
  isSpecialDay: boolean;
  specialDayTitle: string | null;
}

/** Résultat de `getNextOpeningTime()` (Phase 7, §8). */
export interface NextOpeningTimeResult {
  isoDate: string;
  dayOfWeek: DayOfWeek;
  time: TimeString;
  /** 0 = plus tard aujourd'hui, 1 = demain, 2+ = dans N jours — permet à l'UI
   * de choisir entre « aujourd'hui à… » / « demain à… » / « dans N jours à… »
   * (§7) sans refaire le calcul de date elle-même. */
  daysFromNow: number;
}

/**
 * Objet unique et complet consommé par `BranchCard`/`BranchPopup` (Phase 7,
 * §16/§17/§21) — regroupe tout ce qu'il faut pour afficher le statut d'un
 * magasin sans qu'aucun composant n'ait besoin de recalculer quoi que ce
 * soit : ni une heure, ni une date, ni un seuil. Construit UNE SEULE FOIS par
 * `buildBranchStatusViewModel()` (`lib/opening-hours/view-model.ts`), côté
 * serveur (calcul initial) et côté client (rafraîchissement périodique léger,
 * §19/§20) — jamais recalculé différemment selon l'endroit.
 */
export interface BranchStatusViewModel {
  status: BranchStatus;
  /** Jour de la semaine COURANT en Israël (0 = dimanche), déjà résolu par le
   * moteur — permet à `OpeningHours` (UI) de mettre en évidence le bon jour
   * sans jamais calculer lui-même « quel jour sommes-nous » (§13/§21). */
  dayOfWeek: DayOfWeek;
  todayHours: TodayHours | null;
  isSpecialDay: boolean;
  specialDayTitle: string | null;
  minutesUntilChange: number | null;
  /** Heure de fermeture du créneau actif, uniquement quand `status` est `OPEN`
   * ou `CLOSING_SOON` (§9) — `null` sinon. */
  closingTime: TimeString | null;
  /** Prochaine ouverture structurée, uniquement quand le magasin n'est PAS
   * actuellement ouvert (§8) — `null` sinon, ou si aucune ouverture n'a été
   * trouvée dans la fenêtre de recherche. */
  nextOpening: NextOpeningTimeResult | null;
}
