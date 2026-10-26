/**
 * Neutralisation CSV Formula Injection (Phase 10, §36) — un tableur (Excel,
 * Google Sheets, LibreOffice) qui ouvre un CSV interprète toute cellule
 * commençant par `=`, `+`, `-` ou `@` comme une FORMULE, pas comme du texte —
 * un magasin nommé `=cmd|'/c calc'!A1` importé depuis un fichier tiers puis
 * réexporté pourrait exécuter du code chez la personne qui ouvre l'export.
 * Neutralisation standard (OWASP) : préfixer la cellule d'une apostrophe
 * droite `'` — Excel/Sheets/LibreOffice affichent alors la valeur comme texte
 * littéral, jamais comme une formule, quel que soit le premier caractère.
 *
 * Appliquée à TOUTE valeur de cellule exportée (CSV ET XLSX — un magasin
 * `str` XLSX plain n'est normalement pas auto-évalué par Excel, mais la
 * neutralisation ne coûte rien et protège aussi contre l'ouverture d'un
 * export XLSX puis sa réédition/réenregistrement en CSV par l'utilisateur).
 */
const DANGEROUS_PREFIXES = ["=", "+", "-", "@", "\t", "\r"];

export function neutralizeCsvFormulaCell(value: string): string {
  if (value.length === 0) return value;
  if (DANGEROUS_PREFIXES.some((prefix) => value.startsWith(prefix))) {
    return `'${value}`;
  }
  return value;
}

/**
 * Inverse de `neutralizeCsvFormulaCell` — appliquée par le PARSEUR d'import
 * (`lib/import/branch-import.ts`), pas seulement pensée pour l'export : sans
 * elle, un numéro de téléphone légitime ("+972…", `+` étant un des préfixes
 * neutralisés par §36) exporté puis réimporté serait corrompu par
 * l'apostrophe ajoutée à l'export (§31 : « export réimportable à
 * l'identique »). Une apostrophe en tête suivie d'un des préfixes dangereux
 * ne peut provenir QUE de cette neutralisation (aucun champ métier de ce
 * projet ne commence légitimement par une apostrophe) — la retirer est donc
 * toujours sûr, jamais une perte de donnée réelle.
 */
export function unescapeCsvFormulaCell(value: string): string {
  if (value.length < 2 || value[0] !== "'") return value;
  const rest = value.slice(1);
  return DANGEROUS_PREFIXES.some((prefix) => rest.startsWith(prefix)) ? rest : value;
}
