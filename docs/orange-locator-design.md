# Présentation orange du Store Locator

La liste des magasins reprend la proposition graphique approuvée : bandeau
doré `#ffc20a`, illustration de magasin, barre de recherche flottante, cartes
arrondies et carte aux teintes douces. Les repères magasin sont dorés avec un
pictogramme sombre et un petit indicateur de statut. La position de
l'utilisateur reste bleue et les magasins ouverts conservent leur badge vert.

La présentation existe en hébreu, français, anglais, russe et espagnol.
L'hébreu utilise une disposition de droite à gauche ; les autres langues
utilisent une disposition de gauche à droite. Sur mobile, la recherche et les
filtres se réorganisent et les onglets Liste/Carte sont conservés. Le SDK de la
carte reste chargé seulement à la première ouverture de l'onglet sur mobile.

Les cartes affichent la photo principale, l'adresse, les moyennes des avis
publiés et le statut d'ouverture. Les horaires et la liste complète des
services restent accessibles avec le bouton de détails. Les liens vers la
fiche, le téléphone, WhatsApp et le menu d'itinéraire restent fonctionnels.
Le tri propose le nom du magasin ou la proximité lorsque la géolocalisation
est disponible. Sans position, le tri par proximité est désactivé.

Les nouveaux textes sont dans l'espace `locator` des cinq fichiers de
traduction. L'illustration est un SVG décoratif intégré ; aucun service ni
fichier image externe supplémentaire n'est nécessaire. Les styles du locator
sont limités à son conteneur ; l'administration conserve son thème.

Cette mise à jour ne modifie ni le schéma ni les données de la base.

## Validation

- TypeScript, lint et compilation de production réussis.
- 711 tests unitaires et six parcours Playwright réussis.
- Vérification navigateur des cinq langues aux largeurs 320, 390, 768, 1280
  et 1586 pixels : aucun débordement horizontal ni erreur JavaScript.
- Vérification du tri par nom et par proximité avec une position simulée.
- L'environnement local ne possède pas la clé Google Maps de production ; les
  styles et repères sont couverts par les tests de la carte avec SDK simulé.
  Le déployeur conserve la configuration Google Maps du serveur.
