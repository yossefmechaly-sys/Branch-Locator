# Leader et Zol Uvegadol — nouveaux designs

Les deux projets reprennent les améliorations de Branch Locator : recherche
flottante, filtres mobiles lisibles, cartes sélectionnables dans leur espace
blanc, photos et notes, repères assortis, encadrés de carte compacts avec liens
actifs, fiches avec galerie et horaires côte à côte, carte et résumé des avis.
Les cinq langues et le mobile sont pris en charge.

- **Leader : vêtements pour enfants.** Bleu du logo `#3c87da`, illustration de
  boutique de vêtements, textes adaptés et catégorie Schema.org `ClothingStore`.
  Les boutons utilisent un bleu plus soutenu pour la lisibilité du texte blanc.
  Les règles du samedi soir et les horaires non confirmés sont conservés.
- **Zol Uvegadol : supermarché.** Jaune du logo `#ffef01`, texte sombre,
  illustration de magasin alimentaire et catégorie `GroceryStore`.

Les logos existants sont conservés. Les illustrations ne contiennent aucun
logo ou nom de Maayan 2000. Les étoiles des avis restent jaunes et les statuts
d'ouverture restent verts.

Sources complètes sauvegardées :

- [Leader — `sites/leader`](https://github.com/yossefmechaly-sys/Branch-Locator/tree/sites/leader)
- [Zol Uvegadol — `sites/zol-uvegadol`](https://github.com/yossefmechaly-sys/Branch-Locator/tree/sites/zol-uvegadol)

## Validation

- Leader : 752 tests unitaires et 16 parcours navigateur réussis.
- Zol Uvegadol : 725 tests unitaires et 16 parcours navigateur réussis.
- Les compilations de production, TypeScript et lints passent.
- 100 contrôles d'affichage : deux sites, cinq langues, cinq largeurs de 320
  à 1586 pixels, sur les listes et les fiches. Aucun débordement ni erreur
  JavaScript ; logos, couleurs, catégories, menus et accès aux avis vérifiés.
- Dix tests du déployeur par enseigne couvrent notamment le retour arrière,
  les fichiers altérés, les bases partagées et les mauvaises couleurs ou catégories.

Les validations utilisent des bases locales distinctes et des données de
démonstration. Les parcours cartographiques utilisent un SDK Maps simulé ;
les composants et la navigation sont réels. Aucune donnée de démonstration
n'est insérée sur le VPS.

## Installation sur le VPS

Se connecter comme `franck`, puis copier ce bloc :

```bash
(
set -euo pipefail
design_dir=$(mktemp -d /home/franck/design-enseignes.XXXXXX)
cd "$design_dir"
curl -fL "https://github.com/yossefmechaly-sys/Branch-Locator/raw/refs/heads/main/deployments/leader-zol-design.tar.gz" -o designs.tar.gz
printf '%s\n' '4ba136f1cf39a5eff7df46c4669b5b365fdbf47948dd18622afe672f53518126  designs.tar.gz' | sha256sum --check
tar -xzf designs.tar.gz
python3 enseignes-design/leader/deploy.py
python3 enseignes-design/zol-uvegadol/deploy.py
)
```

Attendre un `DEPLOIEMENT_REUSSI` pour chacun des domaines :
`https://leader.tobedev.com`, puis `https://zol-uvegadol.tobedev.com`.

Chaque mise à jour est préparée, vérifiée et basculée séparément. Le script
valide les empreintes, le service systemd et la configuration de sa cible,
vérifie que les bases des trois enseignes sont distinctes et crée une
sauvegarde PostgreSQL privée avec contrôle du catalogue.

Aucune migration n'est exécutée. Les migrations historiques, dont celle des
avis déjà installée, doivent être appliquées avant cette mise à jour de design.
Les photos, les logos et la configuration privées sont conservés sur le VPS.

Les contrôles vérifient les cinq listes et les cinq fiches, la palette, le
logo, la catégorie de magasin, les ressources JavaScript/CSS, les avis et la
connexion administrateur avant et après la bascule, en local puis sur le
domaine public. Un échec après bascule restaure l'ancienne version de cette
enseigne. Branch Locator n'est pas basculé par ces scripts.

Les sauvegardes et les anciennes versions se trouvent dans les dossiers
affichés par les scripts :
`/home/franck/.leader-branch-locator-deployments/<date>/` et
`/home/franck/.zol-uvegadol-branch-locator-deployments/<date>/`.
