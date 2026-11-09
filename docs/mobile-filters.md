# Filtres du locator sur mobile

Les filtres Ville et Services utilisent toute la largeur disponible en dessous
de 480 pixels. De 480 à 767 pixels, ils occupent deux colonnes. Le commutateur
d'ouverture et le bouton de réinitialisation disposent de leur propre place.
Les libellés longs peuvent revenir à la ligne et les flèches restent dans les
boutons. Les zones tactiles mesurent au moins 44 pixels de haut.

Les menus déroulants utilisent explicitement le sens de lecture de la langue
active, y compris de droite à gauche en hébreu. Leur largeur reste dans celle
de l'écran et leurs options disposent de zones tactiles de 44 pixels sur mobile.
Les appels API de filtrage et les traductions sont conservés.

La validation navigateur couvre les cinq langues (hébreu, français, anglais,
russe, espagnol), les largeurs 320, 393, 600 et 1280 pixels, avec texte normal
et agrandi. Elle vérifie la visibilité des textes et des flèches, l'ouverture
des menus au toucher, leur position dans l'écran, la sélection des options
les plus longues, les résultats de l'API et la réinitialisation des filtres.
