"use server";

import { AuthError } from "next-auth";

import { signIn } from "@/lib/auth";
import {
  isLoginRateLimited,
  recordLoginFailure,
} from "@/lib/auth/login-rate-limit";
import {
  ADMIN_DEFAULT_LOCALE,
  isAdminLocale,
} from "@/lib/admin-i18n/config";
import { getAdminDictionary } from "@/lib/admin-i18n/dictionary";

export interface LoginState {
  error: string | null;
}

export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  const password = String(formData.get("password") ?? "");

  const callbackUrlRaw = String(
    formData.get("callbackUrl") ?? "/admin",
  );

  const localeRaw = formData.get("locale");
  const locale = isAdminLocale(localeRaw)
    ? localeRaw
    : ADMIN_DEFAULT_LOCALE;

  const dictionary = getAdminDictionary(locale);

  const callbackUrl = callbackUrlRaw.startsWith("/admin")
    ? callbackUrlRaw
    : "/admin";

  if (!email || !password) {
    return {
      error: dictionary.login.requiredError,
    };
  }

  if (isLoginRateLimited(email)) {
    return {
      error: dictionary.login.rateLimitError,
    };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: callbackUrl,
    });

    return { error: null };
  } catch (error) {
    if (error instanceof AuthError) {
      recordLoginFailure(email);

      return {
        error: dictionary.login.invalidError,
      };
    }

    throw error;
  }
}
