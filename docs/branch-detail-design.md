# Présentation orange des fiches magasin

Les fiches reprennent la maquette approuvée : bandeau orange `#ffc20a`, nom
du magasin, adresse, illustration discrète et barre d'actions flottante.
Les statuts restent verts pour les magasins ouverts et les étoiles jaunes.
Le titre hébreu utilise la police Heebo Black locale, comme la liste des magasins.

Sur ordinateur, la galerie et les horaires sont côte à côte, puis la carte
et un résumé des avis. Sur mobile, les sections s'empilent, les actions se
réorganisent et une barre reste accessible en bas de l'écran. Les styles
sont limités au conteneur `branch-detail`.

La photo principale est la première de la galerie, sans duplication dans le
bandeau. Les miniatures permettent de changer de photo et un compteur indique
la position. Une photo absente ou indisponible affiche un état de repli propre.
Les photos et toutes les informations affichées proviennent du magasin.

Les horaires et le statut partagent toujours le même `NowProvider` et le même
moteur d'horaires en Israël. Le jour actuel est mis en évidence en orange pâle.
Le résumé des avis et la barre du haut utilisent les statistiques publiques,
qui excluent les avis en attente et refusés. L'action Donner mon avis rejoint
le formulaire existant, avec validation, limitation des soumissions,
modération et pagination conservées.

Les descriptions, services disponibles, promotions et magasins voisins sont
conservés plus bas. Les métadonnées, URL canoniques, liens de langues et données
structurées restent alimentés par les données du magasin. Aucune migration de
base de données n'est nécessaire.

## Validation

- TypeScript, lint et compilation de production réussis.
- 725 tests unitaires et 16 parcours Playwright réussis.
- 25 contrôles visuels : cinq langues et largeurs 320, 390, 768, 1024 et 1586
  pixels, sans débordement horizontal ni erreur JavaScript.
- Vérification des liens vers le formulaire d'avis dans les cinq langues.
- Galerie testée avec plusieurs photos, sans photo et avec une photo en erreur.
- Sept contrôles du déployeur couvrent les fichiers altérés, les échecs de
  bascule, la conservation des photos et le refus d'une ancienne fiche encore
  servie dans l'une des langues.

L'environnement de validation utilise des données locales de démonstration.
Les parcours cartographiques utilisent un SDK Maps simulé ; la clé Google Maps
et les photos du VPS sont conservées par le déployeur.
