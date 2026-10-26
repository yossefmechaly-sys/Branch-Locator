"use client";

import { useState } from "react";
import type { VariantProps } from "class-variance-authority";

import { useAdminI18n } from "@/components/admin/AdminI18nProvider";
import { Button } from "@/components/ui/button";
import type { buttonVariants } from "@/components/ui/button";

export function ConfirmButton({
  label,
  confirmLabel,
  onConfirm,
  variant = "destructive",
  disabled = false,
}: {
  label: string;
  confirmLabel: string;
  onConfirm: () => Promise<void>;
  variant?: VariantProps<typeof buttonVariants>["variant"];
  disabled?: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const { dictionary } = useAdminI18n();

  if (!confirming) {
    return (
      <Button
        type="button"
        variant={variant}
        size="sm"
        disabled={disabled}
        onClick={() => setConfirming(true)}
      >
        {label}
      </Button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <Button
        type="button"
        variant="destructive"
        size="sm"
        disabled={pending}
        onClick={async () => {
          setPending(true);

          try {
            await onConfirm();
          } finally {
            setPending(false);
            setConfirming(false);
          }
        }}
      >
        {pending ? "…" : confirmLabel}
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={pending}
        onClick={() => setConfirming(false)}
      >
        {dictionary.common.cancel}
      </Button>
    </span>
  );
}
