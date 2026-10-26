"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";

import type { AdminLocale } from "@/lib/admin-i18n/config";
import type { AdminDictionary } from "@/lib/admin-i18n/dictionary";

interface AdminI18nContextValue {
  locale: AdminLocale;
  dictionary: AdminDictionary;
}

const AdminI18nContext =
  createContext<AdminI18nContextValue | null>(null);

export function AdminI18nProvider({
  locale,
  dictionary,
  children,
}: {
  locale: AdminLocale;
  dictionary: AdminDictionary;
  children: ReactNode;
}) {
  return (
    <AdminI18nContext.Provider value={{ locale, dictionary }}>
      {children}
    </AdminI18nContext.Provider>
  );
}

export function useAdminI18n(): AdminI18nContextValue {
  const context = useContext(AdminI18nContext);

  if (!context) {
    throw new Error(
      "useAdminI18n doit être utilisé dans AdminI18nProvider",
    );
  }

  return context;
}
