# app-aqua — Aqu.app mobile

Coque native iOS / Android (Capacitor) autour du client web `../../client`. Le code de l'interface reste dans `client/` ; ce dossier contient la configuration mobile, les projets natifs générés et les ressources (icônes, splash).

## Prérequis

- Node.js 22, dépendances installées à la racine (`npm install`)
- Android : Android Studio + SDK
- iOS : un Mac avec Xcode (impossible à compiler sous Windows/Linux)
- Comptes développeur pour publier : Apple Developer (99 $/an), Google Play (25 $ une fois)

## Démarrage

```bash
cd app-aqua/mobile
npm install
npm run add:android      # génère android/ (une fois)
npm run add:ios          # génère ios/ (sur Mac, une fois)
npm run sync             # build du client web + copie dans les projets natifs
npm run open:android     # ouvre Android Studio
npm run open:ios         # ouvre Xcode
```

## API en mobile

Le client web appelle `/api` en relatif. Dans l'app native il n'y a pas de proxy Vite : définir l'URL publique de l'API au build du client, par exemple `VITE_API_URL=https://beta.aqu.app npm run build -w client`, et faire pointer `fetch` sur cette base (voir `client/src/lib/api.ts`).

## Feuille de route

- [x] Projet Android généré (android/) · [ ] iOS (sur Mac : `npm run add:ios`)
- [ ] Icônes et splash depuis `../assets/logo/logo.webp`
- [x] Base d'URL API configurable côté client (`VITE_API_URL`)
- [ ] Notifications push (nouveau devis pour les magasins)
- [ ] Photo du bac (appareil photo) jointe au projet
- [ ] Builds de test : TestFlight (iOS) et Play Internal Testing (Android)
