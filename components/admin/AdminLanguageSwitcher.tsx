import { setAdminLocaleAction } from "@/app/admin/language-actions";
import type { AdminLocale } from "@/lib/admin-i18n/config";

export function AdminLanguageSwitcher({
  locale,
}: {
  locale: AdminLocale;
}) {
  return (
    <div
      className="inline-flex items-center rounded-md border bg-background p-0.5 text-xs"
      dir="ltr"
      aria-label="Language"
    >
      <form action={setAdminLocaleAction}>
        <input type="hidden" name="locale" value="fr" />
        <button
          type="submit"
          aria-pressed={locale === "fr"}
          className={`rounded px-2 py-1 ${
            locale === "fr"
              ? "bg-accent font-medium text-accent-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          FR
        </button>
      </form>

      <span className="text-muted-foreground/50">|</span>

      <form action={setAdminLocaleAction}>
        <input type="hidden" name="locale" value="en" />
        <button
          type="submit"
          aria-pressed={locale === "en"}
          className={`rounded px-2 py-1 ${
            locale === "en"
              ? "bg-accent font-medium text-accent-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          EN
        </button>
      </form>

      <span className="text-muted-foreground/50">|</span>

      <form action={setAdminLocaleAction}>
        <input type="hidden" name="locale" value="he" />
        <button
          type="submit"
          aria-pressed={locale === "he"}
          className={`rounded px-2 py-1 ${
            locale === "he"
              ? "bg-accent font-medium text-accent-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          עברית
        </button>
      </form>
    </div>
  );
}
