import { createNavigation } from "next-intl/navigation";

import { routing } from "./routing";

/**
 * Wrappers de navigation conscients de la locale.
 *
 * `Link`, `redirect`, `usePathname` et `useRouter` doivent être importés depuis ce
 * module (jamais directement depuis `next/link` ou `next/navigation`) dans tout
 * composant sous `app/[locale]/**`, afin que la locale courante soit systématiquement
 * préservée lors de la navigation — c'est ce qui garantit, par exemple, que
 * `LanguageSwitcher` conserve la page en cours (§8) plutôt que de renvoyer à l'accueil.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
