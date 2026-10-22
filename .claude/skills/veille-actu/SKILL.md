---
name: veille-actu
description: Veille quotidienne d'actualité pour créer du contenu chaque jour — récupère les infos importantes du jour (Le Parisien, Le Figaro, BFM, CNews, TF1, Le Canard enchaîné, Mediapart), les sujets qui buzzent sur les réseaux (X, TikTok, Instagram, YouTube, Reddit) et la mouvance populaire (grèves, manifs, pétitions, colère sociale), puis produit un brief d'actu daté avec angles de contenu. À utiliser quand l'utilisateur demande « l'actu du jour », « ce qui buzz », « les tendances », « fais-moi la veille », « sujets pour mes vidéos/posts » ou invoque /veille-actu.
argument-hint: "[thème ou mot-clé] [--format brief|scripts|posts] [--pays FR]"
---

# Veille actu — brief quotidien prêt à publier

Objectif : en une commande, sortir un brief daté et sourcé qui dit **ce qui compte aujourd'hui**, **ce qui buzze sur les réseaux**, **ce qui bouge côté mouvance populaire**, et **quels angles de contenu tourner**. Le brief est écrit en français, sauvegardé dans `veille/AAAA-MM-JJ.md` et affiché en chat.

## Arguments

| Argument | Effet |
| --- | --- |
| *(aucun)* | Brief général France du jour |
| `thème` (ex. `retraites`, `JO`, `Macron`, `IA`) | Toute la collecte est recentrée sur ce thème |
| `--format brief` (défaut) | Brief complet (modèle dans `references/template-brief.md`) |
| `--format scripts` | Brief court + 3 scripts vidéo verticale 30-60 s |
| `--format posts` | Brief court + 5 posts (X/Threads, Instagram, TikTok légende, LinkedIn, Facebook) |
| `--pays XX` | Change le pays (défaut `FR`) |

## Règles non négociables

1. **Jamais inventer une info.** Chaque item du brief cite au moins une source (lien) et sa date. Un item avec une seule source est marqué `⚠️ à confirmer`.
2. **Date du jour = date du brief.** Rejeter tout résultat non daté ou plus vieux que 48 h, sauf dans la section « À surveiller » ou s'il s'agit d'un dossier de fond encore chaud.
3. **Les médias prioritaires bloquent la lecture directe** (voir `references/sources.md`). On ne fait **pas** de `WebFetch` sur leurs pages, ni de filtre `allowed_domains` sur ces domaines (erreur 400 garantie). On les atteint **par des requêtes `WebSearch` en mode `extended`** qui nomment le média : les résultats (Google News, revues de presse, agrégateurs, réseaux) remontent leurs titres et chapôs.
4. **Distinguer fait / rumeur / opinion.** Un buzz réseaux n'est pas un fait : le brief dit « circule sur X », « affirmé par », « démenti par ».
5. **Pas de contenu diffamatoire ni de désinformation** dans les angles proposés. Le ton peut être populaire et engagé, pas mensonger.

## Déroulé

### Étape 0 — Cadrage (10 s)

- Date du jour (`date +%F`), jour de la semaine (le Canard enchaîné sort le **mercredi**).
- Thème et format demandés. Pays par défaut : France.
- Créer le dossier `veille/` s'il n'existe pas.

### Étape 1 — Collecte en deux vagues

Toutes les requêtes utilisent `WebSearch` en `mode: "extended"`, **en français, avec la date en toutes lettres** (`{date}` = `22 octobre 2026`, `{date-iso}` = `2026-10-22`). Lancer chaque vague **dans un seul tour** (appels parallèles). Les requêtes exactes et leurs variantes sont dans `references/sources.md`.

**Vague 1 — Panorama (8 à 12 requêtes en parallèle)**

- Vue d'ensemble : `actualité France {date} dernières nouvelles politique` · `revue de presse {date} France unes journaux` · `faits divers France {date}` · `économie pouvoir d'achat France {date}`
- CNews (seul média prioritaire lisible directement) : `CNews {date}`
- Réseaux : `Comptwoir du jour {date} Twog` (digest quotidien des tweets, très efficace) · `tendances Twitter X France aujourd'hui {date} polémique réseaux sociaux` · `TikTok vidéo virale France {date} buzz` · `YouTube tendances France {date}`
- Mouvance populaire : `grève manifestation mobilisation {date} France` · `pétition colère blocage agriculteurs carburant {date}` · `gilets jaunes intersyndicale appel mobilisation {date}` · `mavigilance {date-iso} manifestations` (agenda des manifs du jour)
- Thème (si fourni) : `{thème} {date}` · `{thème} polémique réseaux sociaux réaction`

**Vague 2 — Les unes de tes médias (une requête par média, à partir des sujets de la vague 1)**

⚠️ Vérifié : `Le Parisien {date}`, `Le Figaro {date}`, `BFMTV {date}`, `TF1 Info {date}` **ne remontent rien d'utile** (pages Wikipédia, programmes TV). Il faut **nommer le média + un sujet du jour** : les reprises (agences, agrégateurs comme `titrespresse.com`, Yahoo, Orange Actu, JDD, France 3, Twog) citent alors « selon Le Parisien », « révèle Le Figaro », etc.

- `"Le Parisien" {sujet 1 du jour}` · `"Le Figaro" {sujet 2}` · `"BFMTV" {sujet 3}` · `"TF1" OR "TF1 Info" {sujet 4}`
- `Mediapart révèle {sujet ou enquête en cours}` · `Mediapart enquête {semaine}`
- `Le Canard enchaîné {date du mercredi} révélations` et `"Canard enchaîné" révèle {affaire en cours}` (hebdo du mercredi)
- Si un média ne ressort toujours pas : une seule relance avec `"{média}" {autre sujet}`, puis écrire `— rien de remonté aujourd'hui` dans le brief.

**Bonus RSS (si le réseau l'autorise)** : `bash .claude/skills/veille-actu/scripts/collect-rss.sh [thème]` — tente les flux RSS accessibles et sort une liste `[source] titre — lien — date`. S'il affiche `aucun flux accessible`, l'ignorer (cas des sessions cloud au réseau restreint).

**Ne pas faire** : `WebFetch` sur les sites des médias prioritaires (bloqué), `allowed_domains` sur leurs domaines (erreur 400), plus d'une relance par requête.

### Étape 2 — Fusion et notation

- Regrouper les résultats par sujet (un sujet = même événement, même personne, même affaire).
- Noter chaque sujet avec la grille de `references/scoring.md` :
  - **Importance** (1-5) : impact sur la vie des gens, portée nationale, décision officielle.
  - **Viralité** (1-5) : présence sur plusieurs réseaux, hashtags, réactions de personnalités, vidéo qui circule.
  - **Potentiel contenu** (1-5) : émotion, clarté, visuel, possibilité d'avoir un avis.
  - **Mouvance populaire** (oui/non) : colère sociale, mobilisation, injustice perçue, pouvoir d'achat.
- Garder les **10 meilleurs** sujets (score total) + tous les sujets « mouvance populaire » même mal classés.
- Dédupliquer, vérifier la date, repérer les démentis.

### Étape 3 — Rédaction du brief

Remplir `references/template-brief.md`. Sections obligatoires :

1. **🔴 À la une (3 sujets)** : une phrase de fait + pourquoi ça compte + sources.
2. **📱 Ça buzze sur les réseaux (5 max)** : le sujet, où ça circule, le ton (colère/rire/émotion), statut (fait/rumeur).
3. **✊ Mouvance populaire** : grèves, manifs, pétitions, appels, chiffres de mobilisation, prochaines dates.
4. **📰 Les unes de tes médias** : une ligne par média prioritaire (Le Parisien, Le Figaro, BFM, CNews, TF1, Le Canard enchaîné, Mediapart). Si un média n'a rien remonté, l'écrire (`— rien de remonté aujourd'hui`), ne pas inventer.
5. **🎯 Angles de contenu (3-5)** : pour chaque angle, le hook (première phrase, 8 mots max), le format (vidéo verticale 45 s / carrousel / post texte / live), l'émotion visée, la source à citer à l'écran.
6. **👀 À surveiller demain** : dates, décisions attendues, suites.
7. **Sources** : liste de liens.

### Étape 4 — Variantes de format

- `--format scripts` : ajouter 3 scripts (hook 3 s → contexte 15 s → fait marquant 15 s → avis/question 10 s → appel à commenter 5 s). Charger `anthropic-skills:viral-tiktok-content` ou `viral-instagram-reels` si disponibles pour le style.
- `--format posts` : ajouter 5 posts adaptés par plateforme, avec hashtags en vigueur trouvés à l'étape 1.

### Étape 5 — Livraison

- Écrire le fichier `veille/{date-iso}.md` (écraser s'il existe déjà le même jour).
- Afficher le brief en chat. Terminer par la ligne : `Prochaine veille : relance /veille-actu demain, ou /veille-actu <thème> pour creuser un sujet.`

## Automatiser tous les jours

Deux options, à proposer en une ligne à la fin du premier brief :

- **Session cloud** : créer une tâche planifiée (outil `create_trigger` / `send_later` du serveur `claude-code-remote`) avec `create_new_session_on_fire: true` et le prompt `Lance /veille-actu et pousse veille/<date>.md sur la branche de travail`. Heure conseillée : `CRON_TZ=Europe/Paris 47 6 * * *`.
- **Local** : `/loop` ou un cron système qui lance `claude -p "/veille-actu"`.

## Limites connues

- Le Canard enchaîné est hebdomadaire et payant : on obtient ses titres via les reprises (autres médias, revues de presse, X), pas le texte complet.
- Mediapart est payant : titres + chapôs seulement.
- Les tendances X/TikTok ne sont pas accessibles par API ici : on les reconstitue par recherche (sites de tendances, articles « ce qui buzze », hashtags cités par la presse). Le brief l'indique.
- La recherche web est « US-only » côté moteur mais indexe la presse française : toujours écrire les requêtes **en français avec la date en toutes lettres** pour obtenir du frais.
