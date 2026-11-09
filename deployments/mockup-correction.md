# Correction de la maquette : illustration et titre hébreu

L'illustration du bandeau est extraite de la maquette approuvée, sur fond
transparent. Le « 2000 » fait partie de l'image et reste à sa place dans
l'enseigne, y compris lorsque le document est de droite à gauche.

Le titre `הסניף שלכם, קרוב אליכם` utilise désormais Heebo Black (graisse 900),
une police hébraïque sans empattements, fournie localement avec sa licence.
Le navigateur n'utilise plus sa police système pour ce titre.

La correction a été compilée et vérifiée dans les cinq langues aux largeurs
320, 390 et 1586 pixels. Chromium confirme que les glyphes du titre hébreu
sont rendus avec la police Heebo téléchargée depuis le site.

## Installation sur le VPS

Depuis le compte `franck`, après l'installation du design orange :

```bash
(
set -euo pipefail
maquette_dir=$(mktemp -d /home/franck/correction-maquette.XXXXXX)
cd "$maquette_dir"
curl -fL "https://github.com/yossefmechaly-sys/Branch-Locator/raw/refs/heads/main/deployments/branch-locator-mockup-illustration.tar.gz" -o correction.tar.gz
printf '%s\n' 'bcca6013daf9400abf7a61f7a3a49cf0147d637d88c672e19bc61d50e30247f5  correction.tar.gz' | sha256sum --check
tar -xzf correction.tar.gz
python3 branch-locator-mockup-illustration/deploy.py
)
```

Le résultat attendu est `DEPLOIEMENT_REUSSI : https://branch-locator.tobedev.com`.

Le script cible uniquement `branch-locator.service`, prépare une compilation
isolée et vérifie les cinq langues, l'image, la police, les magasins, les avis,
les photos et la connexion administrateur avant et après la bascule. Les
empreintes de l'image et de la police servies doivent correspondre aux fichiers
du paquet. Les sept contrôles du déployeur sont inclus dans `test_deploy.py`.

Les photos et la configuration privées sont conservées. Aucune migration de
base de données n'est exécutée. En cas d'échec après bascule, la version
précédente est restaurée. Son chemin est affiché en fin d'exécution.
