"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAdminI18n } from "@/components/admin/AdminI18nProvider";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/admin/ConfirmButton";

import {
  hardDeleteCityAction,
  setCityActiveAction,
} from "./actions";

export function CityRowActions({
  id,
  isActive,
  branchCount,
  canDeactivate,
  canHardDelete,
}: {
  id: string;
  isActive: boolean;
  branchCount: number;
  canDeactivate: boolean;
  canHardDelete: boolean;
}) {
  const router = useRouter();
  const { dictionary } = useAdminI18n();
  const t = dictionary.common;

  return (
    <div className="flex items-center gap-2">
      <Button asChild variant="outline" size="sm">
        <Link href={`/admin/cities/${id}/edit`}>
          {t.edit}
        </Link>
      </Button>

      {canDeactivate && (
        <Button
          variant="secondary"
          size="sm"
          onClick={async () => {
            await setCityActiveAction(id, !isActive);
            router.refresh();
          }}
        >
          {isActive ? t.deactivate : t.activate}
        </Button>
      )}

      {canHardDelete && (
        <ConfirmButton
          label={t.delete}
          confirmLabel={t.deletePermanently}
          disabled={branchCount > 0}
          onConfirm={async () => {
            await hardDeleteCityAction(id);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
