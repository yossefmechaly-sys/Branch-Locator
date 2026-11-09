# Leader et Zol Uvegadol — avis clients et photos

Les deux projets disposent des avis avec modération dans `/admin/reviews`, des
notes moyennes avec étoiles jaunes sur les cartes et des photos principales
sous forme de petites vignettes. Les avis non publiés restent privés.

Sources complètes adaptées :

- [Leader — branche `sites/leader`](https://github.com/yossefmechaly-sys/Branch-Locator/tree/sites/leader)
- [Zol Uvegadol — branche `sites/zol-uvegadol`](https://github.com/yossefmechaly-sys/Branch-Locator/tree/sites/zol-uvegadol)

Les logos et les données propres aux enseignes sont conservés. Leader conserve
sa logique des horaires du samedi soir, une heure après la sortie de Shabbat.
La base de données, les photos téléversées et les secrets restent sur le VPS.

## Validation locale

- Leader : 737 tests unitaires et six parcours navigateur réussis.
- Zol Uvegadol : 711 tests unitaires et six parcours navigateur réussis.
- Les deux compilations de production, contrôles TypeScript et lints passent.
- Dix contrôles du déployeur couvrent notamment le retour arrière, la séparation
  des bases et le refus des migrations historiques inattendues.
- Les sauvegardes des deux bases locales ont été restaurées et vérifiées.

## Installation sur le VPS

Se connecter comme `franck`, puis copier ce bloc. Chaque enseigne est préparée,
contrôlée et basculée séparément ; l'exécution s'arrête si l'une échoue.

```bash
(
set -euo pipefail
enseignes_dir=$(mktemp -d /home/franck/deploiement-enseignes.XXXXXX)
cd "$enseignes_dir"
curl -fL "https://github.com/yossefmechaly-sys/Branch-Locator/raw/refs/heads/main/deployments/leader-zol-customer-experience.tar.gz" -o enseignes.tar.gz
printf '%s\n' '6c64ff92b36867701c4ec22f764859d00c8b5e54f777c521f08b1b5a09bf00b1  enseignes.tar.gz' | sha256sum --check
tar -xzf enseignes.tar.gz
python3 enseignes-customer-experience/leader/deploy.py
python3 enseignes-customer-experience/zol-uvegadol/deploy.py
)
```

Attendre un `DEPLOIEMENT_REUSSI` pour chacun des domaines :
`https://leader.tobedev.com` puis `https://zol-uvegadol.tobedev.com`.

Le script vérifie les empreintes des fichiers reçus, la configuration et le
service systemd de chaque cible. Il confirme que les bases sont distinctes de
celles des autres enseignes, crée une sauvegarde PostgreSQL privée et vérifie
son catalogue avant d'appliquer la seule nouvelle migration des avis.
Aucune donnée de démonstration n'est insérée en production.

La compilation et le serveur de contrôle sont préparés séparément. Après la
bascule, les contrôles vérifient les magasins, le formulaire de connexion,
les avis, les moyennes, les vignettes, le logo et les ressources JavaScript/CSS,
à la fois en local et sur le domaine public. Un échec déclenche la restauration
du code et des fichiers compilés précédents. La migration additive est conservée.

Les dossiers de retour arrière et de sauvegarde sont affichés dans les traces :
`/home/franck/.leader-branch-locator-deployments/<date>/` et
`/home/franck/.zol-uvegadol-branch-locator-deployments/<date>/`.
Les sauvegardes PostgreSQL sont dans `database.dump` ; les reçus locaux sont
`receipt.json` et ne contiennent aucune valeur de connexion.
