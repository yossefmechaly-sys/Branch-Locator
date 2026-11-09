# Accès à la fiche depuis la carte

Le titre du magasin et le bouton Détails dans l'encadré de la carte ouvrent
la fiche complète dans la langue active : `/<langue>/branches/<slug>`.
Ce comportement s'applique à l'InfoWindow sur ordinateur et au panneau mobile.

Ce sont des liens HTML natifs : ils fonctionnent aussi dans la racine React
séparée utilisée par Google Maps, avec le clavier et l'ouverture dans un
nouvel onglet. Le bouton Détails est doré et dispose d'une hauteur tactile
minimale de 44 pixels. L'ancien rappel qui sélectionnait simplement le magasin
dans la liste est retiré.

Les tests unitaires couvrent les cinq langues et les deux types d'encadré,
avec un identifiant interne différent du slug public. Les tests Playwright
sélectionnent un repère puis ouvrent la vraie fiche via chacun des deux liens,
sur ordinateur et mobile, en vérifiant l'URL et le titre de la page.
Seul le SDK cartographique est simulé ; les composants React, les requêtes et
la navigation de l'application sont réels.
