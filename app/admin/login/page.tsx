import type { Metadata } from "next";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AdminLanguageSwitcher } from "@/components/admin/AdminLanguageSwitcher";
import { getAdminDictionary } from "@/lib/admin-i18n/dictionary";
import { getAdminLocale } from "@/lib/admin-i18n/get-admin-locale";

import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Branch Locator Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage(props: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const [searchParams, locale] = await Promise.all([
    props.searchParams,
    getAdminLocale(),
  ]);

  const callbackUrl = searchParams.callbackUrl ?? "/admin";
  const dictionary = getAdminDictionary(locale);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-3 flex justify-end">
          <AdminLanguageSwitcher locale={locale} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{dictionary.login.title}</CardTitle>
            <CardDescription>
              {dictionary.login.description}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <LoginForm
              callbackUrl={callbackUrl}
              dictionary={dictionary}
              locale={locale}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
