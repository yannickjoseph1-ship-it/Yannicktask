# Rendu de la vidéo 3D sur ton PC (avec ta carte graphique)

## Une seule fois : installer les outils
1. Installe **Node.js** (version LTS) : https://nodejs.org
2. Installe **Git** : https://git-scm.com

## Récupérer le projet et lancer le rendu
Ouvre un terminal (sous Windows : « Terminal » ou « PowerShell ») et colle :

```
git clone -b ccr-9f334b9f-5j8t95 https://github.com/yannickjoseph1-ship-it/Yannicktask.git
cd Yannicktask/cybertip-videos/anim
npm install
npx playwright install chromium
npm run apercu
```

`npm run apercu` calcule les 10 premières secondes pour vérifier que tout marche :
→ `cybertip-videos/cybertip_frigos_9x16_apercu.mp4`

Si c'est bon, lance la vidéo complète :

```
npm run render
```

→ `cybertip-videos/cybertip_frigos_9x16.mp4` (1080×1920, 30 i/s, avec la voix)

Au démarrage, le script affiche la carte graphique utilisée. S'il écrit
« passage en rendu logiciel », la carte n'a pas pu être utilisée : le rendu
marche quand même, mais plus lentement.

## Déjà cloné ?
```
cd Yannicktask
git pull
cd cybertip-videos/anim
npm install
npm run render
```
