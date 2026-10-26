# lib/import — Import magasins (Phase 10, Partie D)

Moteur d'import CSV/XLSX pour les magasins (`/admin/import-export`).
`branch-import.ts` est le SEUL moteur de validation, appelé identiquement
par l'aperçu (dry-run, `previewBranchImport`) et par l'import réel
(`executeBranchImport`, `services/admin/import.service.ts`) — jamais deux
moteurs différents (§25).

## Colonnes (`BRANCH_IMPORT_COLUMNS`)

Téléchargez le template officiel depuis `/admin/import-export` (« Télécharger
le template CSV ») — il contient l'en-tête exact et une ligne d'exemple.

| Colonne | Obligatoire | Format |
| --- | --- | --- |
| `branchCode` | oui | texte libre, unique — identifiant de correspondance prioritaire (§26) |
| `slug` | oui | minuscules/chiffres/tirets — identifiant de correspondance secondaire (§26) |
| `citySlug` | oui | doit correspondre au `slug` d'une ville déjà créée dans `/admin/cities` |
| `district`, `postalCode` | non | texte libre |
| `address` | oui | texte libre |
| `latitude`, `longitude` | oui | nombres décimaux |
| `phone`, `email`, `whatsappNumber`, `whatsappGroupUrl`, `wazeUrlOverride` | non | texte libre / URL |
| `isActive` | non | `vrai`/`faux`/`true`/`false`/`1`/`0` (vide = actif) |
| `sortOrder` | non | entier (vide = 0) |
| `serviceSlugs` | non | slugs de services séparés par **des points-virgules** (ex. `kosher;parking`) — jamais de virgule, réservée au CSV |
| `hours_dim` … `hours_sam` | non (les 7 ensemble) | voir ci-dessous |
| `displayName_he` | oui | traduction hébreu — obligatoire (§4 Phase 9) |
| `displayName_en`/`ru`/`fr`/`es` | non | traductions optionnelles — absentes = avertissement, pas une erreur |

## Format des horaires (§29)

Une colonne par jour, `hours_dim` (dimanche) à `hours_sam` (samedi) — même
ordre que `OpeningHoursEditor`. Cellule :

- **vide** → fermé ce jour-là ;
- **`HH:mm-HH:mm`** → un créneau (ex. `09:00-18:00`) ;
- **`HH:mm-HH:mm,HH:mm-HH:mm`** → deux créneaux séparés par une virgule (ex.
  `09:00-13:00,16:00-19:00`).

Si **aucune** des 7 colonnes n'est présente dans le fichier, les horaires ne
sont pas touchés (création : magasin sans horaires renseignés, comme le
formulaire admin le permet déjà ; mise à jour : les horaires existants sont
conservés tels quels). Si au moins une colonne est présente, les 7 sont
lues ensemble et remplacent l'intégralité des horaires hebdomadaires.

Les mêmes règles que `OpeningHoursEditor`/le moteur Phase 7 s'appliquent
(`closingTime` après `openingTime`, pas de créneau traversant minuit) — un
horaire syntaxiquement valide mais dans le mauvais ordre est refusé avec le
même message d'erreur que le formulaire admin.

## Correspondance magasin existant (§26)

1. `branchCode` correspond à un magasin existant → **mise à jour** de ce
   magasin.
2. Sinon, `slug` correspond à un magasin existant → **mise à jour** de ce
   magasin.
3. Sinon → **création**.
4. Si `branchCode` ET `slug` correspondent chacun à un magasin existant
   **différent** → erreur de conflit, la ligne est rejetée (jamais un
   matching par nom affiché, jamais un choix arbitraire entre les deux).

## Transactions (§28)

1. **Toutes** les lignes sont d'abord validées (aucune écriture).
2. Les lignes en erreur sont exclues **individuellement** — elles ne
   bloquent jamais les autres lignes valides du même fichier.
3. Les lignes valides sont écrites dans **une seule transaction** Prisma :
   soit toutes les écritures aboutissent, soit aucune (jamais un état
   intermédiaire où certaines lignes valides seraient écrites et d'autres
   non).

## Sécurité upload (§36)

Extension (`.csv`/`.xlsx`) et taille (5 Mo) vérifiées avant tout parsing ;
nombre de lignes plafonné (2000) pour éviter un fichier absurde ou une
XLSX conçue pour épuiser la mémoire au décompactage. Le MIME déclaré par le
navigateur est un indice, jamais la seule vérification.
