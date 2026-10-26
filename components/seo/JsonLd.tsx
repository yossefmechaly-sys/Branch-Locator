/**
 * Injecte un objet JSON-LD (`lib/seo/schema.ts`) dans un `<script
 * type="application/ld+json">` (Phase 8, §21/§31) — Server Component pur,
 * aucune interactivité.
 *
 * Échappe tout `<` en `<` (§ sécurité) : `JSON.stringify()` ne place
 * jamais de `<` en dehors d'une chaîne (les caractères structurels JSON sont
 * `{}[],:"`), donc ce remplacement reste toujours à l'intérieur d'une valeur
 * JSON — `<` y est une séquence d'échappement JSON valide. Sans ça, une
 * chaîne source contenant `</script>` (ex. un titre de promotion malicieux ou
 * mal formé) romprait la balise `<script>` et casserait le JSON-LD suivant,
 * voire injecterait du HTML arbitraire dans la page.
 */
export interface JsonLdProps {
  data: Record<string, unknown>;
}

export function JsonLd({ data }: JsonLdProps) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
