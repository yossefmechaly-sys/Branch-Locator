import { SearchX } from "lucide-react";
import { useTranslations } from "next-intl";

/** État `empty` de `BranchList` : recherche/filtres actifs mais aucun résultat. */
export function BranchListEmptyState() {
  const t = useTranslations("branches");

  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-10 text-center">
      <SearchX className="size-8 text-muted-foreground" aria-hidden="true" />
      <p className="font-medium text-foreground">{t("noResultsTitle")}</p>
      <p className="text-sm text-muted-foreground">{t("noResultsHint")}</p>
    </div>
  );
}
