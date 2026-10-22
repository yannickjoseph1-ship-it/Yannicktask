# Sources — veille-actu

## 1. Médias prioritaires (demandés par l'utilisateur)

| Média | Rythme | Accès direct (WebFetch / allowed_domains) | Comment l'atteindre |
| --- | --- | --- | --- |
| Le Parisien (`leparisien.fr`) | quotidien | ❌ bloque le robot | `WebSearch` extended : `Le Parisien {date}` / `"Le Parisien" {sujet}` |
| Le Figaro (`lefigaro.fr`) | quotidien | ❌ bloque le robot | `Le Figaro {date}` / `"Le Figaro" {sujet}` |
| BFMTV (`bfmtv.com`) | continu | ❌ bloque le robot | `BFMTV {date}` / `BFM {sujet} direct` |
| CNews (`cnews.fr`) | continu | ⚠️ domaine souvent injoignable | `CNews {date}` / `CNews {sujet}` |
| TF1 Info / JT 20h (`tf1info.fr`) | quotidien | ❌ bloque le robot | `TF1 Info {date}` / `JT 20h TF1 {date}` |
| Le Canard enchaîné (`lecanardenchaine.fr`) | hebdo, **mercredi**, payant | ❌ bloque le robot | `Le Canard enchaîné {date} révélations` / `"Canard enchaîné" révèle` |
| Mediapart (`mediapart.fr`) | quotidien, payant | ❌ bloque le robot | `Mediapart enquête {date}` / `"Mediapart" révèle {sujet}` |

Vérifié le 2026-10-22 : un `WebSearch` avec `allowed_domains` sur ces domaines renvoie `400 — domains are not accessible to our user agent`. Ne jamais filtrer dessus. Les titres remontent quand même via Google News, les revues de presse (Europe 1, France Inter, RTL, franceinfo), les agrégateurs et les reprises sur X.

## 1 bis. Ce qui marche vraiment (testé le 2026-10-22)

| Besoin | Requête / page | Résultat observé |
| --- | --- | --- |
| Titres Le Parisien / Le Figaro / BFM / TF1 | `"{média}" {sujet du jour}` | reprises par Anadolu, Orange Actu, titrespresse.com, JDD, France 3, Twog (« selon Le Parisien ») |
| Titres CNews | `CNews {date}` | articles cnews.fr datés du jour, directement |
| Mediapart | `Mediapart révèle {sujet}` | reprises France 24, Yahoo, armees.com, politiquematin |
| Canard enchaîné | `"Canard enchaîné" révèle {affaire}` | reprises 21news.be, YouTube Shorts, presse régionale |
| Buzz X du jour | `Comptwoir du jour {date} Twog` | page twog.fr qui compile les tweets marquants du jour |
| Manifs du jour | `mavigilance {date-iso}` · `manifs.fr` · `paris-luttes.info` · `bonjour-ratp.fr manifestation {date}` | agenda ville par ville, stations fermées |
| Suites d'un mouvement | `acte II {date} appel mobilisation` · `intersyndicale {date}` | France 24, CNews, syndicats |
| Vue d'ensemble politique | `actualité France {date} dernières nouvelles politique` | franceinfo (replays), Public Sénat, titrespresse |

Les requêtes `{média} {date}` seules renvoient du bruit (Wikipédia, grilles TV) : toujours ajouter un sujet.

## 2. Compléments presse (vue d'ensemble)

franceinfo, France Inter (revue de presse 8h30), Europe 1 (revue de presse), RTL, Le Monde, Libération, 20 Minutes, Ouest-France, L'Express, Le Point, Marianne, HuffPost, Brut, Konbini, HugoDécrypte, Le Média, Blast, Frustration Magazine, Street Press.

Requêtes : `revue de presse {date} France`, `les unes {date}`, `actualité France {date}`.

## 3. Réseaux sociaux — ce qui buzze

| Réseau | Signal | Requêtes / pages |
| --- | --- | --- |
| X / Twitter | tendances France, hashtags, ratio | `tendances Twitter France {date}`, `hashtag {sujet} X réactions`, pages de tendances : `trends24.in/france`, `getdaytrends.com/france` |
| TikTok | sons, hashtags, vidéos virales | `TikTok viral France {date}`, `TikTok Creative Center hashtags France` |
| Instagram | Reels, comptes médias (Brut, Konbini, Hugo Décrypte) | `Reels viral {date} France`, `Brut {sujet}` |
| YouTube | tendances, vidéos de réaction | `YouTube tendances France {date}` |
| Reddit | r/france, r/actualite | `Reddit r/france {sujet}` |
| Facebook / groupes | relais mobilisations, pages colère | `groupe Facebook mobilisation {sujet}` |

Signaux de viralité à relever : nombre de vues/tweets si cité, personnalités qui réagissent, reprise par la presse (« la vidéo qui fait réagir »), démenti officiel (preuve que ça a pris).

## 4. Mouvance populaire — colère sociale et mobilisations

Thèmes à surveiller tous les jours : grèves (SNCF, RATP, enseignants, hôpitaux, raffineries), manifestations et blocages, pétitions (change.org, `petitions.assemblee-nationale.fr`), agriculteurs, pouvoir d'achat (carburant, électricité, loyers, courses), retraites, impôts, logement, prix, conditions de travail, violences policières, injustices locales devenues nationales, gilets jaunes et collectifs citoyens, référendum et initiatives citoyennes.

Requêtes : `grève {date}`, `manifestation {date}`, `mobilisation {date} appel`, `intersyndicale {date}`, `pétition {date} signatures`, `blocage {date}`, `colère {date} France`, `agriculteurs {date}`, `gilets jaunes {date}`.

Sources utiles : sites syndicaux (CGT, CFDT, FO, Sud, FSU), Coordination rurale / FNSEA, Attac, collectifs locaux, préfectures (arrêtés), `petitions.assemblee-nationale.fr`, Le Média, Blast, Frustration, Street Press.

## 5. Flux RSS (utilisables seulement si le réseau sort librement)

Le script `scripts/collect-rss.sh` tente ces flux et ignore ceux qui échouent :

- Google News FR : `https://news.google.com/rss?hl=fr&gl=FR&ceid=FR:fr`
- Google News recherche : `https://news.google.com/rss/search?q={requête}&hl=fr&gl=FR&ceid=FR:fr`
- Google Trends FR (quotidien) : `https://trends.google.com/trending/rss?geo=FR`
- Le Figaro : `https://www.lefigaro.fr/rss/figaro_actualites.xml`
- Le Parisien : `https://feeds.leparisien.fr/leparisien/rss`
- BFMTV : `https://www.bfmtv.com/rss/news-24-7/`
- CNews : `https://www.cnews.fr/rss.xml`
- TF1 Info : `https://www.tf1info.fr/rss/`
- Mediapart : `https://www.mediapart.fr/articles/feed`
- franceinfo : `https://www.francetvinfo.fr/titres.rss`
- Le Monde : `https://www.lemonde.fr/rss/une.xml`
- 20 Minutes : `https://www.20minutes.fr/feeds/rss-une.xml`
- Reddit r/france : `https://www.reddit.com/r/france/hot.json?limit=25`

Dans les sessions cloud au réseau restreint (cas vérifié le 2026-10-22), tous ces hôtes sont refusés par le proxy : le script affiche `aucun flux accessible` et la collecte se fait entièrement par `WebSearch`.
