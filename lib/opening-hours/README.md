# lib/opening-hours

Moteur d'horaires — fonctions pures, fuseau `Asia/Jerusalem` explicite (jamais celui
du serveur).

- `getBranchStatus()` (Phase 4) : statut courant (`OPEN` / `CLOSED` / `OPENING_SOON`
  / `CLOSING_SOON` / `TEMPORARILY_CLOSED`), horaires du jour, minutes avant le
  prochain changement. Gère les horaires hebdomadaires (`BranchOpeningHours`), les
  horaires spéciaux (`SpecialOpeningHours` — jours fériés, veilles de fête) et les
  créneaux à coupure méridienne (`openingTime2`/`closingTime2`).
- `getNextOpeningTime()`, `getClosingTime()` formatés pour affichage détaillé :
  Phase 7 (non nécessaires pour le statut simple de la Phase 4).

Testé unitairement dans `tests/unit/opening-hours-status.test.ts`.
