"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AdminDictionary } from "@/lib/admin-i18n/dictionary";
import type { AdminLocale } from "@/lib/admin-i18n/config";

import { loginAction, type LoginState } from "./actions";

const INITIAL_STATE: LoginState = { error: null };

export function LoginForm({
  callbackUrl,
  dictionary,
  locale,
}: {
  callbackUrl: string;
  dictionary: AdminDictionary;
  locale: AdminLocale;
}) {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    INITIAL_STATE,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <input type="hidden" name="locale" value={locale} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          {dictionary.login.email}
        </label>

        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          disabled={isPending}
          dir="ltr"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          {dictionary.login.password}
        </label>

        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={isPending}
          dir="ltr"
        />
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={isPending} className="mt-2">
        {isPending
          ? dictionary.login.pending
          : dictionary.login.submit}
      </Button>
    </form>
  );
}
