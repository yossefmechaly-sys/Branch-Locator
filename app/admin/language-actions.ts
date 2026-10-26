"use server";

import { cookies } from "next/headers";

import {
  ADMIN_LOCALE_COOKIE,
  isAdminLocale,
} from "@/lib/admin-i18n/config";

export async function setAdminLocaleAction(formData: FormData): Promise<void> {
  const locale = formData.get("locale");

  if (!isAdminLocale(locale)) {
    return;
  }

  const cookieStore = await cookies();

  cookieStore.set(ADMIN_LOCALE_COOKIE, locale, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    maxAge: 60 * 60 * 24 * 365,
  });
}
