/**
 * Configuration centrale du moteur d'horaires (Phase 7, §6/§20) — seuils et
 * fuseau horaire définis UNE SEULE FOIS ici, jamais recopiés ni redéfinis dans
 * un composant ou une autre couche. Toute évolution (ex. seuil OPENING_SOON
 * différent de CLOSING_SOON) se fait dans ce seul fichier.
 */

/** Fuseau horaire utilisé pour TOUT calcul horaire du Store Locator — jamais
 * celui du serveur (souvent UTC) ni celui du navigateur de l'utilisateur
 * (§2/§11 : un visiteur hors d'Israël ne doit jamais voir un statut basé sur
 * son propre fuseau). */
export const OPENING_HOURS_TIMEZONE = "Asia/Jerusalem";

/** Fenêtre (en minutes) avant une ouverture/fermeture pendant laquelle le
 * statut bascule vers OPENING_SOON / CLOSING_SOON plutôt que CLOSED / OPEN
 * (§6 : « OPENING_SOON si ouverture dans les 60 prochaines minutes »). Un seul
 * seuil partagé pour les deux transitions — rien n'exige qu'ils diffèrent,
 * donc une seule constante plutôt que deux qui pourraient diverger par
 * erreur. */
export const SOON_THRESHOLD_MINUTES = 60;

/** Horizon de recherche de `getNextOpeningTime()` (§8 : « au minimum une
 * recherche sur les 7 prochains jours »). Borne stricte la boucle de
 * recherche — jamais de boucle indéfinie même si un magasin n'a aucune
 * donnée d'horaires exploitable. */
export const NEXT_OPENING_SEARCH_WINDOW_DAYS = 7;

/** Cadence du rafraîchissement client léger du statut (§19/§20) — un seul
 * timer central (`hooks/useNow.ts`), jamais un par `BranchCard`, et jamais un
 * nouvel appel réseau complet : seul `now` change, le moteur (déjà chargé
 * côté client) recalcule localement à partir des horaires déjà reçus. */
export const STATUS_REFRESH_INTERVAL_MS = 60_000;
