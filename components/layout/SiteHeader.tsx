import Image from "next/image";
import { useTranslations } from "next-intl";

import { Link } from "@/lib/i18n/navigation";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";

/**
 * En-tête global de l'application publique.
 *
 * `ms-auto` (margin-inline-start) plutôt que `ml-auto` : en RTL, le sélecteur de
 * langue reste du côté "fin" visuel de la barre sans logique conditionnelle sur
 * `dir` — c'est la règle RTL/LTR du cahier des charges (§5) appliquée dès le
 * premier composant de layout.
 */
export function SiteHeader() {
  const t = useTranslations("nav");

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
        <Link href="/branches" className="shrink-0" aria-label={t("brand")}>
          <Image
            src="/images/maayan-2000-logo.png"
            alt={t("brand")}
            width={2000}
            height={453}
            priority
            className="h-8 w-auto sm:h-11"
          />
        </Link>
        <nav className="hidden items-center gap-4 text-sm text-muted-foreground sm:flex">
          <Link href="/branches" className="hover:text-foreground">
            {t("branches")}
          </Link>
        </nav>
        <div className="ms-auto flex items-center gap-2">
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
