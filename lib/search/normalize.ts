/**
 * Normalisation de texte pour comparaison de recherche insensible à la casse et
 * aux diacritiques latins (accents français/espagnols : "Jérusalem" → "jerusalem").
 *
 * `NFKD` + suppression des marques combinantes (`\p{Diacritic}`) est un no-op sûr
 * pour l'hébreu et le russe dans nos données (ni l'un ni l'autre script n'utilise
 * de diacritiques combinables ici — le hébreu n'a pas de niqoud dans le seed) :
 * une même fonction unique couvre donc correctement les cinq langues supportées
 * (cahier des charges §6/§20 — recherche multilingue).
 */
export function normalizeSearchText(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}
