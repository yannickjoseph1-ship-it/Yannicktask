# Aqu.app — marketplace biface aquariophilie (MVP)

Application web permettant à des aquariophiles amateurs de **concevoir et visualiser leur aquarium en 3D**, puis d'être mis en relation avec les **magasins référencés** proposant le matériel adapté, avec une **estimation de budget**.

- **Client (gratuit)** : configure son bac (volume, type d'eau, poissons, plantes, décor, matériel), voit la compatibilité, la modélisation 3D, la liste des produits correspondants chez les magasins partenaires et le budget total.
- **Magasin (abonnement)** : importe son catalogue (CSV/JSON) avec tags, souscrit un abonnement Stripe (Standard / Premium), apparaît dans les recommandations et reçoit des leads. Le tier **Premium** est prioritaire à produit équivalent.

## Stack

| Couche | Techno |
| --- | --- |
| Backend | Node.js 22, Express 5, TypeScript, Prisma 7 (+ `@prisma/adapter-pg`), PostgreSQL 16 |
| Auth | JWT (bcrypt), deux rôles `CLIENT` / `SHOP` |
| Paiement | Stripe Checkout + webhooks (abonnements récurrents), mode simulé hors production |
| Frontend | React 19, Vite, React Router, React Three Fiber + drei (Three.js) — charte : bleu marine `#000080`, police San Francisco (pile système Apple) |
| Tests | Vitest (moteur de matching, compatibilité, importeur) |

## Démarrage rapide

```bash
# 1. PostgreSQL (Docker) — ou utilisez une instance locale
docker compose up -d db

# 2. Dépendances
npm install

# 3. Variables d'environnement
cp server/.env.example server/.env   # adapter DATABASE_URL / JWT_SECRET si besoin

# 4. Base de données : migrations + client Prisma + données de démo
npm run db:migrate        # prisma migrate dev
npm run db:seed           # référentiel espèces + comptes + catalogues démo

# 5. Lancer API (http://localhost:4000) et front (http://localhost:5173 : accueil, /app configurateur, /shop magasin)
npm run dev
```

Tests du moteur : `npm test`.

### Comptes de démonstration (mot de passe `password123`)

| Email | Rôle | Abonnement |
| --- | --- | --- |
| `client@demo.fr` | Client | — |
| `aqualyon@demo.fr` | Magasin *Aqua Lyon* | Premium |
| `recif@demo.fr` | Magasin *Récif & Co* (eau douce + marin) | Standard |
| `nord@demo.fr` | Magasin *Poissons du Nord* | Aucun → invisible dans les recommandations |

## Architecture

```
server/
  prisma/schema.prisma          # schéma de données (ci-dessous)
  prisma/seed.ts                # espèces, comptes, catalogues démo
  prisma/species-data.ts        # référentiel espèces (45 espèces)
  samples/catalog-sample.{csv,json}   # formats d'import magasin
  src/domain/                   # logique métier PURE (sans Prisma, testée)
    types.ts                    #   types du domaine
    matching/requirements.ts    #   config client → liste de besoins
    matching/score.ts           #   filtres durs + scoring + priorité premium
    matching/index.ts           #   matchConfiguration() : mix + offres par magasin
    compatibility/index.ts      #   vérification poissons/poissons/plantes/matériel
  src/routes/                   # auth, species, aquariums (preview/quote), shop, webhooks
  src/services/                 # catalog (chargement), catalog-import (CSV/JSON), stripe
client/
  src/pages/HomePage            # page d'accueil publique (hero 3D, parcours, offre magasins)
  src/pages/ConfiguratorPage    # configurateur client (/app : formulaire, 3D, résultats)
  src/pages/ShopDashboardPage   # back-office magasin (abonnement, import, produits, leads)
  src/three/                    # scène R3F : bac, eau, substrat, poissons animés, plantes, décor, matériel
```

### Schéma de données (Prisma)

- **User** (`role` CLIENT | SHOP) → **Shop** (1-1 pour les magasins) : `subscriptionTier` (NONE/STANDARD/PREMIUM), `subscriptionStatus`, identifiants Stripe, `currentPeriodEnd`.
- **Product** (catalogue magasin, clé d'upsert `shopId + externalRef`) : `category` (TANK, FILTER, HEATER, LIGHT, SUBSTRATE, CO2, DECOR, FISH, INVERTEBRATE, PLANT, FOOD, WATER_TREATMENT, ACCESSORY), `price`, `stockQty`, `tags[]`, `compatibleSpecies[]`, `speciesSlug` (vivant), `waterTypes[]`, `minVolumeL`/`maxVolumeL`, `attributes` JSON (`volumeL`, `flowLph`, `powerW`, `lumens`, `lengthCm`, `weightKg`…).
- **Species** (référentiel commun, seedé) : type d'eau, volume mini, plages température/pH, taille adulte, tempérament, taille de groupe, mordilleur / longues nageoires / prédateur, courant, besoins lumière/CO2, incompatibilités explicites, tags (`bottom-dweller`, `labyrinth`, `reef`…).
- **Aquarium** + **AquariumItem** (configuration client : `kind` FISH/INVERTEBRATE/PLANT/DECOR/EQUIPMENT, `refSlug`, `quantity`).
- **Quote** + **QuoteLine** : résultat de matching persisté (budget, couverture, produit/magasin retenu par besoin). Côté magasin, les lignes sont les **leads**.

### Moteur de matching (`server/src/domain/matching`)

C'est le cœur du MVP ; il est indépendant de la base et couvert par les tests.

1. **Dérivation des besoins** (`deriveRequirements`) : la configuration est traduite en besoins par catégorie avec des règles aquariophiles : bac au volume cible, filtre à ≈ 4× le volume (10× en marin), chauffage ≈ 1 W/L si espèce tropicale, éclairage dimensionné selon le besoin lumineux des plantes (10/25/45 lm/L) et la longueur du bac, substrat en kg (5 cm, sol nutritif si plantes enracinées, sable fin si fouisseurs), kit CO2 si plante exigeante, sel marin à 35 g/L, un besoin par espèce / plante / décor / matériel demandé, nourriture adaptée, conditionneur.
2. **Filtres durs** (`passesHardFilters`) : catégorie, stock > 0, type d'eau, espèce exacte (`speciesSlug`) pour le vivant, tags obligatoires (ex. `driftwood`), plage de volume déclarée par le produit.
3. **Score** (0..1) = 35 % tags souhaités + 35 % proximité des attributs techniques (sous-dimensionner est plus pénalisé que sur-dimensionner) + 20 % prix selon la préférence client (Éco / Standard / Haut de gamme) + 10 % compatibilité espèces déclarée, **+ 0,05 de bonus Premium**. Tri : score, puis premium, puis prix.
4. **Agrégation** : meilleur produit + alternatives par besoin, budget total et par catégorie, taux de couverture, et **offres par magasin** (tout acheter au même endroit) triées par couverture, premium, prix.

Seuls les produits des magasins dont l'abonnement est **ACTIF** entrent dans le matching.

### Vérification de compatibilité (`server/src/domain/compatibility`)

Erreurs / avertissements / infos sur : type d'eau, volume minimal, surpopulation (règle 1 cm/L), taille de banc, incompatibilités explicites, plages de température et pH, prédation, tempérament, mordilleurs vs longues nageoires, besoins de courant divergents, poissons herbivores vs plantes, CO2 / éclairage intense, chauffage requis, pompe à air vs poissons à labyrinthe.

## API

Toutes les routes sont préfixées par `/api`. Auth : `Authorization: Bearer <jwt>`.

| Méthode | Route | Rôle | Description |
| --- | --- | --- | --- |
| POST | `/auth/register` | — | `{ role: "CLIENT" \| "SHOP", email, password, displayName, shop?: { name, city } }` |
| POST | `/auth/login` | — | `{ email, password }` → `{ token, user }` |
| GET | `/auth/me` | auth | Profil courant |
| GET | `/species?waterType=&kind=` | — | Référentiel espèces |
| GET | `/species/options` | — | Slugs de décor et de matériel |
| POST | `/aquariums/preview` | CLIENT | Analyse sans sauvegarde : `{ dimensions, compatibility, match }` |
| GET/POST | `/aquariums` | CLIENT | Liste / création |
| GET/PUT/DELETE | `/aquariums/:id` | CLIENT | Lecture / mise à jour / suppression |
| POST | `/aquariums/:id/quote` | CLIENT | Matching + devis persisté (génère des leads) |
| GET | `/aquariums/:id/quotes` | CLIENT | Historique des devis |
| GET/PUT | `/shop/me` | SHOP | Fiche magasin + statistiques |
| POST | `/shop/catalog/upload` | SHOP | multipart `file` (CSV/JSON) ou body `{ products: [...] }` → rapport d'import |
| GET | `/shop/products` | SHOP | Catalogue paginé |
| DELETE | `/shop/products/:id` · `/shop/products` | SHOP | Désactivation d'un produit / de tout le catalogue |
| GET | `/shop/leads` | SHOP | Lignes de devis clients pointant vers le magasin |
| GET | `/shop/subscription` | SHOP | État + plans |
| POST | `/shop/subscription/checkout` | SHOP | `{ tier }` → URL Stripe Checkout |
| POST | `/shop/subscription/portal` | SHOP | URL du portail de facturation |
| POST | `/shop/subscription/dev` | SHOP | Simulation (hors production, sans clé Stripe) |
| POST | `/webhooks/stripe` | Stripe | Webhook (body brut, signature vérifiée) |

### Format d'import catalogue

Colonnes CSV (ou clés JSON) : `ref*, name*, category*, price*, currency, stock, brand, image_url, tags, compatible_species, species_slug, water_types, min_volume_l, max_volume_l, attributes` (JSON) ou colonnes `attr_<nom>` (ex. `attr_flowLph`). Listes séparées par `|`. Séparateur `,` ou `;`, BOM toléré. Voir `server/samples/`.

## Stripe

1. Créer deux prix récurrents mensuels (Standard, Premium) dans le dashboard Stripe.
2. Renseigner `STRIPE_SECRET_KEY`, `STRIPE_PRICE_STANDARD`, `STRIPE_PRICE_PREMIUM`.
3. Webhook vers `/api/webhooks/stripe` (événements `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_failed`) et `STRIPE_WEBHOOK_SECRET`. En local : `stripe listen --forward-to localhost:4000/api/webhooks/stripe`.

Sans clé Stripe (dev), le back-office propose une activation simulée.

## Hors périmètre MVP

Génération d'images IA, machine learning, application mobile, notation/avis.
