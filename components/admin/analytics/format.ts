import type { AdminLocale } from "@/lib/admin-i18n/config";

/**
 * Formatage partagé par les composants `/admin/analytics`.
 * Les valeurs métier ne changent pas : seule la locale d'affichage varie.
 */

function intlLocale(locale: AdminLocale): string {
  if (locale === "he") return "he-IL";
  if (locale === "en") return "en-US";
  return "fr-FR";
}

export function formatCount(value: number, locale: AdminLocale): string {
  return new Intl.NumberFormat(intlLocale(locale)).format(value);
}

/** Ratio 0..1 → pourcentage affiché, "—" si non calculable. */
export function formatRatioPercent(ratio: number | null, locale: AdminLocale): string {
  if (ratio === null) return "—";

  const value = (ratio * 100).toLocaleString(intlLocale(locale), {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  });

  return `${value}\u00a0%`;
}

export interface DeltaDisplay {
  text: string;
  tone: "positive" | "negative" | "neutral";
}

export function formatDeltaPercent(value: number | null, locale: AdminLocale): DeltaDisplay {
  if (value === null) return { text: "—", tone: "neutral" };

  const rounded = Math.round(value * 10) / 10;

  if (rounded === 0) {
    return { text: `0\u00a0%`, tone: "neutral" };
  }

  const sign = rounded > 0 ? "+" : "";

  return {
    text: `${sign}${rounded.toLocaleString(intlLocale(locale), {
      maximumFractionDigits: 1,
    })}\u00a0%`,
    tone: rounded > 0 ? "positive" : "negative",
  };
}
