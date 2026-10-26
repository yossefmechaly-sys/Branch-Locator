import { requireAdminSession } from "@/lib/auth/require";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { getAdminLocale } from "@/lib/admin-i18n/get-admin-locale";
import { getAdminDictionary } from "@/lib/admin-i18n/dictionary";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [{ user }, locale] = await Promise.all([
    requireAdminSession(),
    getAdminLocale(),
  ]);

  const dictionary = getAdminDictionary(locale);

  return (
    <div className="flex min-h-screen">
      <AdminSidebar dictionary={dictionary} />

      <div className="flex flex-1 flex-col">
        <AdminHeader
          user={user}
          locale={locale}
          dictionary={dictionary}
        />

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
