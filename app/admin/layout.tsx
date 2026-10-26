import type { Metadata } from "next";

import "../globals.css";

import { getAdminDirection } from "@/lib/admin-i18n/config";
import { getAdminLocale } from "@/lib/admin-i18n/get-admin-locale";
import { getAdminDictionary } from "@/lib/admin-i18n/dictionary";
import { AdminI18nProvider } from "@/components/admin/AdminI18nProvider";

export const metadata: Metadata = {
  title: { default: "Administration", template: "%s · Administration Maayan 2000" },
  robots: { index: false, follow: false },
};

export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getAdminLocale();
  const dictionary = getAdminDictionary(locale);

  return (
    <html
      lang={locale}
      dir={getAdminDirection(locale)}
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body className="min-h-full bg-muted/20 text-foreground">
        <AdminI18nProvider
          locale={locale}
          dictionary={dictionary}
        >
          {children}
        </AdminI18nProvider>
      </body>
    </html>
  );
}
