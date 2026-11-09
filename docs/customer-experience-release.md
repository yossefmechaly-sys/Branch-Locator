# Avis clients et photos — Zol Uvegadol

Le projet contient les avis sur le site, avec note sur 5 et commentaire soumis
à modération dans `/admin/reviews`. Seuls les avis publiés contribuent aux
moyennes, aux étoiles jaunes et au taux de satisfaction. Les cartes de la liste
affichent aussi la photo principale, avec un repli si elle est indisponible.

Cette intégration conserve les ressources et la configuration propres à Zol Uvegadol.
Les tests locaux passent : 711 tests unitaires, six parcours navigateur,
contrôle TypeScript et compilation de production. Les données de démonstration
sont réservées aux bases locales et CI ; le déploiement ne lance pas le seed.

La migration `20261025000000_branch_reviews` ajoute uniquement les avis. Le
paquet vérifie les sources, sauvegarde la base propre à l'enseigne, vérifie
l'isolation des bases, compile séparément et conserve les fichiers précédents
pour le retour arrière.

Instructions de déploiement :
https://github.com/yossefmechaly-sys/Branch-Locator/blob/main/deployments/enseignes.md
