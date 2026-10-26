import { TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

export interface BranchListErrorStateProps {
  onRetry: () => void;
}

/** État `error` de `BranchList` : la requête vers `/api/branches` a échoué. */
export function BranchListErrorState({ onRetry }: BranchListErrorStateProps) {
  const t = useTranslations("branches");
  const tCommon = useTranslations("common");

  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-destructive/40 bg-destructive/5 p-10 text-center">
      <TriangleAlert className="size-8 text-destructive" aria-hidden="true" />
      <p className="font-medium text-foreground">{t("errorTitle")}</p>
      <p className="text-sm text-muted-foreground">{t("errorHint")}</p>
      <Button type="button" variant="outline" size="sm" className="mt-2" onClick={onRetry}>
        {tCommon("retry")}
      </Button>
    </div>
  );
}
