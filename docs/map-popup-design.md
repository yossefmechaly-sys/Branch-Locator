# Encadrés de carte — présentation orange

L'encadré regroupe la photo principale (ou une icône de magasin si elle manque),
le nom, l'adresse, la note publique lorsqu'elle existe, le statut d'ouverture
et la distance. Les contacts sont alignés et le bouton orange vers la fiche
occupe toute la largeur. Les liens du nom, de la photo et du bouton utilisent
la langue active ; la note rejoint la section des avis.

L'option officielle `InfoWindow.headerDisabled` supprime l'en-tête natif de
Google qui réservait une grande zone vide au-dessus du contenu. Un bouton
de fermeture traduit, accessible au clavier, est intégré au contenu, sur
ordinateur comme sur mobile. Aucune classe CSS interne de Google n'est modifiée.

Les styles sont limités au composant `map-branch-popup`, avec la même palette
orange que le locator et les fiches. Une photo inaccessible affiche une icône.
Le panneau mobile respecte la zone de gestes et peut défiler si son contenu
dépasse la hauteur disponible. Les promotions réelles restent affichées.

Validation : compilation de production et lint réussis, 30 tests unitaires
ciblés et dix parcours navigateur couvrant les cinq langues, sur ordinateur
et mobile. Les parcours vérifient aussi la fermeture, la désélection et les
liens vers les fiches. Le SDK Maps est simulé localement ; les composants React
et la navigation de l'application sont réels.

Trente variantes visuelles ont également été vérifiées : cinq langues,
largeurs 320, 393 et 1280 pixels, avec et sans photo et note publique, sans
débordement horizontal.
