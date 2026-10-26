import { TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * Bandeau "données de démonstration" (cahier des charges §74 : les données DEMO ne
 * doivent jamais être présentées comme les données réelles de Maayan 2000).
 *
 * Volontairement un bloc pleine largeur avec texte qui retourne à la ligne — et non
 * un `Badge` (conçu pour des libellés courts et `whitespace-nowrap`) : un badge sur
 * une phrase complète déborde hors viewport en mobile dès qu'une traduction est plus
 * longue que l'hébreu (constaté en français/russe/espagnol).
 */
export function DemoNotice() {
  const t = useTranslations("common");

  return (
    <div className="mb-6 flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-200">
      <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <p>{t("demoNotice")}</p>
    </div>
  );
}
