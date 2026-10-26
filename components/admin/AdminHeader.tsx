import { LogOut } from "lucide-react";

import { logoutAction } from "@/app/admin/(dashboard)/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AdminDictionary } from "@/lib/admin-i18n/dictionary";
import type { AdminLocale } from "@/lib/admin-i18n/config";
import type { AdminSessionUser } from "@/types/admin";

import { AdminLanguageSwitcher } from "./AdminLanguageSwitcher";

export function AdminHeader({
  user,
  locale,
  dictionary,
}: {
  user: AdminSessionUser;
  locale: AdminLocale;
  dictionary: AdminDictionary;
}) {
  const roleLabels = {
    SUPER_ADMIN: dictionary.header.roles.superAdmin,
    ADMIN: dictionary.header.roles.admin,
    EDITOR: dictionary.header.roles.editor,
  } as const;

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4">
      <div className="ms-auto flex items-center gap-3 text-sm">
        <AdminLanguageSwitcher locale={locale} />

        <span className="font-medium">{user.name}</span>

        <Badge variant="secondary">
          {roleLabels[user.role]}
        </Badge>

        <form action={logoutAction}>
          <Button type="submit" variant="ghost" size="sm">
            <LogOut className="size-4" />
            {dictionary.header.logout}
          </Button>
        </form>
      </div>
    </header>
  );
}
