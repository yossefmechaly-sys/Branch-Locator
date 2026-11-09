# Sélection depuis la carte d'un magasin

Un clic ou un toucher sur le fond, l'adresse ou le statut d'une carte magasin
sélectionne le magasin comme un clic sur son titre : cadre orange, repère
sélectionné, recentrage de la carte et ouverture de l'encadré cartographique.
Ce comportement est commun aux cinq langues.

Le titre reste un bouton accessible au clavier. Les liens (fiche, photo,
avis, téléphone, WhatsApp), les boutons d'itinéraire et d'horaires conservent
leur action propre. Les clics dans les menus rendus hors de la carte ne
sélectionnent pas le magasin. La sélection de texte reste possible.

Le suivi `branch_card_click` est émis une seule fois par sélection, que le
clic provienne du titre ou du reste de la carte.

Les contrôles unitaires vérifient la sélection depuis le fond, l'adresse et
le titre, ainsi que les liens et les boutons imbriqués. Les parcours navigateur
vérifient le cadre orange, la sélection unique, les coordonnées transmises à
la carte, le zoom et le magasin affiché dans l'encadré, dans les cinq langues
sur ordinateur et mobile. Le SDK cartographique est simulé ; les composants
React et la navigation sont réels.
