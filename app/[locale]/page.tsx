import { redirect } from "@/lib/i18n/navigation";

/**
 * `/[locale]` redirige vers le Store Locator (§7 du cahier des charges).
 * Aucun contenu propre à la page d'accueil n'est prévu au MVP.
 */
export default async function RootPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  redirect({ href: "/branches", locale: locale as "he" | "en" | "ru" | "fr" | "es" });
}
