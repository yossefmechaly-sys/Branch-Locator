import type { OpeningHoursEntry } from "@/types/opening-hours";
import { buildOpeningHoursSpecification } from "./opening-hours-schema";
import { absoluteImageUrl } from "./site";

/**
 * JSON-LD `GroceryStore`/`BreadcrumbList` (Phase 8, §21-§23/§31) — fonctions
 * pures retournant de simples objets sérialisables (`Record<string, unknown>`,
 * pas de type Schema.org tiers) : testables sans DOM (§39), sérialisées en
 * JSON par `components/seo/JsonLd.tsx` au moment du rendu.
 *
 * Règle stricte des deux fonctions ci-dessous (§21 : « ne pas inventer de
 * données ») : tout champ dont la donnée source est absente est OMIS du
 * schéma plutôt que rempli avec une valeur vide/inventée — jamais
 * `telephone: ""` ou `image: null` dans le JSON-LD final.
 */

export interface GroceryStoreSchemaInput {
  name: string;
  /** URL canonique de la fiche (§19), utilisée aussi comme `url` du schéma. */
  url: string;
  /** Chemin relatif OU URL absolue (`Branch.mainImage` est stocké en base
   * comme un chemin relatif, ex. `/demo/branches/jerusalem-ramot.jpg`) —
   * rendu absolu ci-dessous via `absoluteImageUrl()` (§21 : Schema.org exige
   * une URL absolue pour `image`, jamais un chemin relatif au domaine
   * courant). `null` si aucune photo n'est disponible : omis du schéma,
   * jamais remplacé par l'image générique de repli — celle-ci reste réservée
   * à l'aperçu Open Graph (`lib/seo/metadata.ts`). */
  image: string | null;
  telephone: string | null;
  streetAddress: string | null;
  addressLocality: string | null;
  postalCode: string | null;
  latitude: number;
  longitude: number;
  openingHours: readonly OpeningHoursEntry[];
  /** URL Google Maps de navigation vers ce magasin (déjà construite par
   * `lib/navigation/google-maps.ts`, jamais reconstruite ici) — `hasMap`. */
  mapUrl: string | null;
  /**
   * Offres `Schema.org` (Phase 9, §17) — UNIQUEMENT les promotions actives de
   * ce magasin dont le PRIX est réellement connu (`LocalizedPromotion.price
   * !== null`) : c'est à l'appelant (`app/[locale]/branches/[slug]/page.tsx`)
   * de filtrer, jamais à ce module de deviner un prix manquant. `availability`
   * est délibérément absent de `Offer` (voir `buildGroceryStoreSchema` plus
   * bas) — aucune donnée de stock fiable n'existe dans cette application,
   * même principe que `image`/`telephone` ci-dessus : omettre plutôt
   * qu'inventer.
   */
  offers?: readonly GroceryStoreOfferInput[];
}

/** Entrée minimale nécessaire pour représenter une promotion comme `Offer`
 * Schema.org (§17) — `price` reste une chaîne décimale (jamais un `number`,
 * §2), `currency` un code ISO 4217 (`PromotionCurrency`, ex. "ILS"), déjà
 * valide par construction puisqu'il vient de `Promotion.currency`. */
export interface GroceryStoreOfferInput {
  price: string;
  currency: string;
  /** Nom du produit (`productName` traduit) — `null` pour une promotion sans
   * produit structuré (ce cas est de toute façon exclu en amont : voir
   * `GroceryStoreSchemaInput.offers`, qui ne reçoit que des promotions AVEC
   * prix, donc normalement toujours avec `productName`, mais ce champ reste
   * défensivement nullable). */
  name: string | null;
  /** URL externe du CTA (`Promotion.url`) — `null` si aucune n'est configurée
   * (§16 : pas encore de page individuelle par promotion, donc pas d'URL de
   * repli à construire ici). */
  url: string | null;
  /** "YYYY-MM-DD" */
  validFrom: string;
  /** "YYYY-MM-DD" */
  validThrough: string;
}

export function buildGroceryStoreSchema(input: GroceryStoreSchemaInput): Record<string, unknown> {
  const address: Record<string, unknown> = { "@type": "PostalAddress", addressCountry: "IL" };
  if (input.streetAddress) address.streetAddress = input.streetAddress;
  if (input.addressLocality) address.addressLocality = input.addressLocality;
  if (input.postalCode) address.postalCode = input.postalCode;

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "GroceryStore",
    name: input.name,
    url: input.url,
    address,
    geo: {
      "@type": "GeoCoordinates",
      latitude: input.latitude,
      longitude: input.longitude,
    },
    openingHoursSpecification: buildOpeningHoursSpecification(input.openingHours),
  };

  if (input.image) schema.image = absoluteImageUrl(input.image);
  if (input.telephone) schema.telephone = input.telephone;
  if (input.mapUrl) schema.hasMap = input.mapUrl;

  // `makesOffer` (Phase 9, §17) — omis entièrement si `offers` est vide/absent
  // (aucune promotion active avec prix connu pour ce magasin en ce moment) :
  // même règle que le reste de ce fichier, jamais un tableau vide inséré pour
  // le principe. `availability` volontairement absent de chaque `Offer` —
  // aucune donnée de stock fiable n'existe dans cette application (voir la
  // documentation de `GroceryStoreSchemaInput.offers` ci-dessus).
  if (input.offers && input.offers.length > 0) {
    schema.makesOffer = input.offers.map((offer) => {
      const jsonOffer: Record<string, unknown> = {
        "@type": "Offer",
        price: offer.price,
        priceCurrency: offer.currency,
        validFrom: offer.validFrom,
        validThrough: offer.validThrough,
      };
      if (offer.name) jsonOffer.itemOffered = { "@type": "Product", name: offer.name };
      if (offer.url) jsonOffer.url = offer.url;
      return jsonOffer;
    });
  }

  return schema;
}

export interface BreadcrumbItem {
  name: string;
  /** URL absolue de l'étape — `null` pour l'étape courante (page affichée),
   * qui n'a pas besoin de pointer vers elle-même dans le JSON-LD. */
  url: string | null;
}

/** `BreadcrumbList` Schema.org (§31) — `item` est omis pour l'étape sans URL
 * (page courante), conformément à la spécification (le dernier maillon d'un
 * fil d'Ariane peut légitimement n'avoir pas de lien). */
export function buildBreadcrumbSchema(items: readonly BreadcrumbItem[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => {
      const listItem: Record<string, unknown> = {
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
      };
      if (item.url) listItem.item = item.url;
      return listItem;
    }),
  };
}
