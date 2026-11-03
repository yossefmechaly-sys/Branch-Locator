# Photos dans la liste des magasins

Les cartes de `/[locale]/branches` utilisent la photo principale `mainImage`
déjà enregistrée dans la fiche du magasin. La vignette mesure 80 × 80 pixels
sur petit écran et 96 × 96 pixels à partir de 640 pixels. Elle est recadrée
avec `object-cover`, avec des coins arrondis et un lien vers la fiche complète.

Le chargement est différé pour les images hors écran. Une photo absente ou
impossible à charger est remplacée par une icône de magasin discrète dans le
même emplacement. Le nom, l'adresse, la distance et les avis restent lisibles.
La mise en page suit le sens de lecture de la langue, notamment l'hébreu.

Changer la photo principale dans l'administration suffit à changer la vignette.
Aucune nouvelle donnée, migration ou photo de remplacement n'est ajoutée à la
base. Les photos téléversées utilisent le même mode de chargement que la fiche.

Le paquet de déploiement inclut aussi les moyennes et étoiles de la liste : il
accepte la version avec avis modérés et la version avec moyennes déjà installées.
