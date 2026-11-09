# Zol Uvegadol — supermarché — nouveau design

Le jaune du logo est `#ffef01`, avec des libellés sombres. L’illustration
représente un magasin alimentaire sans logo d’une autre enseigne. La catégorie
Schema.org reste `GroceryStore`.

La liste, les fiches magasin, les encadrés de carte et leurs repères reprennent
les améliorations de Branch Locator. Les cartes de la liste se sélectionnent
au clic dans leur espace blanc ; les liens et les boutons gardent leurs actions.
Les filtres mobiles sont lisibles, le titre hébreu utilise Heebo Black, les
photos principales et les notes publiques sont affichées lorsqu'elles existent.
Les avis en attente ou refusés ne sont jamais comptabilisés publiquement.

Les logos existants et les données propres à l'enseigne sont conservés.
Les photos et la configuration privées restent sur le VPS. Le code des règles
horaires, les dépôts de données et les migrations existantes ne sont pas remplacés.
Aucune migration ni insertion de démonstration n'est exécutée en production.

Validation : compilation, TypeScript et lint réussis ; 725 tests unitaires
et 16 parcours navigateur réussis. Les cinq langues ont été vérifiées aux
largeurs 320, 390, 768, 1280 et 1586 pixels, sur la liste et sur les fiches,
sans débordement ni erreur JavaScript. Les tests utilisent des données locales
de démonstration et un SDK Maps simulé pour les parcours cartographiques.
