import { getLeaderSaturdaySlot } from "./lib/opening-hours/leader-shabbat.mjs";

const hours = {
  openingRule: "ONE_HOUR_AFTER_SHABBAT" as const,
  closingTime: "23:00",
  officialTextHe: "שעה אחרי צאת השבת עד 23:00"
};

const formatter = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Asia/Jerusalem",
  dateStyle: "short",
  timeStyle: "short"
});

for (const date of [
  "2026-06-20T12:00:00Z",
  "2026-10-17T12:00:00Z",
  "2026-10-24T12:00:00Z",
  "2026-10-31T12:00:00Z",
  "2026-12-19T12:00:00Z"
]) {
  const slot = getLeaderSaturdaySlot(
    hours,
    31.812,
    35.195,
    new Date(date)
  );

  console.log(
    date.slice(0, 10),
    "| Ouverture :",
    slot ? formatter.format(new Date(slot.openingTimestamp)) : "ERREUR",
    "| Fermeture :",
    slot ? formatter.format(new Date(slot.closingTimestamp)) : "ERREUR"
  );
}
