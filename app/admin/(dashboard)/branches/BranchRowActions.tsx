"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { useAdminI18n } from "@/components/admin/AdminI18nProvider";

import {
  hardDeleteBranchAction,
  setBranchActiveAction,
} from "./actions";

export function BranchRowActions({
  id,
  isActive,
  canDeactivate,
  canHardDelete,
}: {
  id: string;
  isActive: boolean;
  canDeactivate: boolean;
  canHardDelete: boolean;
}) {
  const router = useRouter();
  const { dictionary } = useAdminI18n();
  const t = dictionary.common;

  return (
    <div className="flex items-center gap-2">
      <Button asChild variant="outline" size="sm">
        <Link href={`/admin/branches/${id}/edit`}>
          {t.edit}
        </Link>
      </Button>

      {canDeactivate && (
        <Button
          variant="secondary"
          size="sm"
          onClick={async () => {
            await setBranchActiveAction(id, !isActive);
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
          onConfirm={async () => {
            await hardDeleteBranchAction(id);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
