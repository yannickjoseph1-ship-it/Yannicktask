# Cahier des charges — Aqu.app

Document vivant. Version 1.0 · 20 octobre 2026. Mettre à jour la section « Historique » à chaque changement.

## 1. Vision

Aqu.app est une marketplace biface dédiée à l'aquariophilie. Les aquariophiles amateurs conçoivent et visualisent leur aquarium, puis sont mis en relation avec les magasins référencés qui proposent le matériel et le vivant adaptés. Les magasins paient un abonnement pour apparaître dans les recommandations et recevoir des leads.

## 2. Utilisateurs

| Rôle | Accès | Ce qu'il fait |
| --- | --- | --- |
| Client (aquariophile) | gratuit | configure son bac, vérifie la compatibilité, visualise en 3D, obtient un devis et les magasins correspondants |
| Magasin | abonnement Standard 29 € / mois ou Premium 79 € / mois | importe son catalogue (CSV/JSON), reçoit des leads, gère son abonnement ; Premium = priorité à produit équivalent |

## 3. Périmètre fonctionnel

### 3.1 Livré dans le MVP (état au 20/10/2026)

- [x] Authentification JWT, deux rôles `CLIENT` / `SHOP`
- [x] Configurateur : volume, dimensions, type d'eau (douce / marine / saumâtre), poissons, invertébrés, plantes, décor, matériel complémentaire, préférence de budget (éco / standard / haut de gamme)
- [x] Référentiel de 45 espèces (poissons, invertébrés, plantes) avec paramètres d'eau, tailles, tempérament, besoins
- [x] Vérification de compatibilité : type d'eau, volume mini, surpopulation, bancs, température, pH, prédation, tempérament, mordilleurs, courant, herbivores vs plantes, CO2, éclairage, chauffage, pompe à air
- [x] Moteur de matching : besoins dérivés de la configuration → produits réels du catalogue (filtres durs, score tags / attributs / prix / espèces, bonus Premium), meilleur mix et offres par magasin, budget total
- [x] Visualisation 3D (React Three Fiber) avec assets génériques
- [x] Devis persistés, leads côté magasin
- [x] Back-office magasin : import de catalogue CSV/JSON avec rapport d'erreurs, produits, leads, abonnement
- [x] Stripe : Checkout, portail, webhooks ; mode simulé hors production
- [x] Page d'accueil publique, charte appliquée (bleu marine, San Francisco)
- [x] Version bêta déployable (Docker, CI), PWA installable, configurateur mobile par onglets
- [x] Dossier `app-aqua/mobile` : coque Capacitor, projet Android généré

### 3.2 À faire (priorités)

1. [ ] Déploiement bêta sur un domaine HTTPS avec sauvegardes de la base
2. [ ] Configuration Stripe réelle (prix, webhook) et test d'un abonnement de bout en bout
3. [ ] Inscription et connexion alignées sur la charte, mot de passe oublié
4. [ ] Page « Mes aquariums » avec historique des devis
5. [ ] Fiche magasin publique (adresse, horaires, lien) et contact depuis le devis
6. [ ] App mobile : projet iOS, icônes et splash, build TestFlight / Play Internal Testing
7. [ ] Notifications aux magasins à chaque nouveau lead (email)
8. [ ] Enrichir le référentiel espèces (objectif 150) et les règles de compatibilité
9. [ ] Analytics produit (configurations créées, devis, conversion abonnement)

### 3.3 Hors périmètre (pour l'instant)

Génération d'images par IA, recommandations personnalisées par apprentissage, notation et avis, paiement des produits dans l'app (commission envisagée en phase 2, voir forecast).

## 4. Règles métier clés

- Seuls les magasins à abonnement **ACTIF** apparaissent dans le matching.
- Un produit n'est proposé que s'il passe les filtres durs : catégorie, stock > 0, type d'eau, espèce exacte pour le vivant, tags obligatoires, plage de volume déclarée.
- Score = 35 % tags + 35 % attributs techniques + 20 % prix selon préférence + 10 % compatibilité espèces, + 0,05 pour un magasin Premium. Tri : score, puis Premium, puis prix.
- Dimensionnement : filtre ≈ 4 × le volume (10 × en marin), chauffage ≈ 1 W/L si espèce tropicale (t° mini ≥ 20 °C), éclairage 10 / 25 / 45 lm/L selon les plantes, substrat ≈ 5 cm, sel marin 35 g/L.
- Catalogue : upsert par `(magasin, ref)` ; colonnes `ref, name, category, price` obligatoires.

## 5. Architecture technique

- Monorepo npm : `server` (Node 22, Express 5, Prisma 7, PostgreSQL 16), `client` (React 19, Vite, React Three Fiber), `app-aqua/mobile` (Capacitor).
- Logique métier pure et testée dans `server/src/domain` (matching, compatibilité) ; 24 tests Vitest.
- Déploiement : `docker-compose.beta.yml` (base, API, front nginx), CI GitHub Actions.
- Détail de l'API et des formats d'import : `README.md` à la racine.

## 6. Modèle économique et objectifs

Abonnements magasins (29 € / 79 €) ; commission sur ventes envisagée en phase 2. Forecast 24 mois : https://claude.ai/artifact/HKu3FcnU2eQRRPRgUQXsZU. Objectif bêta : 5 magasins pilotes, 200 configurations, 50 devis sur les 3 premiers mois.

## 7. Historique

| Date | Version | Changement |
| --- | --- | --- |
| 16/10/2026 | 0.1 | MVP livré : schéma, matching, compatibilité, auth, API, 3D, back-office, Stripe |
| 16/10/2026 | 0.2 | Page d'accueil et charte Aqu.app, bêta déployable, PWA, onglets mobile |
| 20/10/2026 | 1.0 | Création du dossier `app-aqua` : assets, charte graphique, ce cahier des charges, coque mobile |
