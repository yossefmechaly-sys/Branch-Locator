import { cookies } from "next/headers";

import {
  ADMIN_DEFAULT_LOCALE,
  ADMIN_LOCALE_COOKIE,
  isAdminLocale,
  type AdminLocale,
} from "./config";

export async function getAdminLocale(): Promise<AdminLocale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(ADMIN_LOCALE_COOKIE)?.value;

  return isAdminLocale(value) ? value : ADMIN_DEFAULT_LOCALE;
}
