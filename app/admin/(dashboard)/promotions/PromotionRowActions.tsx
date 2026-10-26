"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAdminI18n } from "@/components/admin/AdminI18nProvider";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/admin/ConfirmButton";

import {
  archivePromotionAction,
  hardDeletePromotionAction,
} from "./actions";

export function PromotionRowActions({
  id,
  canDeactivate,
  canHardDelete,
}: {
  id: string;
  canDeactivate: boolean;
  canHardDelete: boolean;
}) {
  const router = useRouter();
  const { dictionary } = useAdminI18n();
  const t = dictionary.common;

  return (
    <div className="flex items-center gap-2">
      <Button asChild variant="outline" size="sm">
        <Link href={`/admin/promotions/${id}/edit`}>
          {t.edit}
        </Link>
      </Button>

      {canDeactivate && (
        <ConfirmButton
          label={t.archive}
          confirmLabel={t.confirm}
          variant="secondary"
          onConfirm={async () => {
            await archivePromotionAction(id);
            router.refresh();
          }}
        />
      )}

      {canHardDelete && (
        <ConfirmButton
          label={t.delete}
          confirmLabel={t.deletePermanently}
          onConfirm={async () => {
            await hardDeletePromotionAction(id);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
