# Politics : le guide de grande stratégie appliqué au jeu

*« 5ème République — Les chemins du pouvoir ». Document de la session cloud « Assets Politics jeu », 25 octobre 2026.*

Ce document reprend les 5 piliers du guide de grande stratégie (Europa Universalis, Crusader Kings, Hearts of Iron) et les transpose à l'échelle du jeu : **une commune fictive, Saint-Aubin-sur-Vière, et ses cinq quartiers, du 1er janvier 1980 au second tour des municipales, le 13 mars 1983**. La partie couvre la fin du mandat 1977-1983. Pour chaque pilier, il indique :
- ce que le jeu fait déjà, d'après le README et les docs 14 et 15 de la session Godot ;
- ce qui manque ;
- les assets et les textes que la session cloud peut produire.

Le principe reste celui du guide : on ne joue pas les individus un par un, on gère le destin de la commune. Les « nations » deviennent des quartiers, des groupes du conseil et des adversaires. La « guerre » devient la campagne électorale.

---

## 1. La carte comme interface principale

**Le principe :** les provinces ont chacune leurs variables ; les départs sont inégaux.

**Déjà dans le jeu**
- Une carte de la commune avec une couche « quartier » (capture `02_carte_couche_quartier`).
- Des quartiers nommés, chacun avec ses soucis : les Tilleuls, la Chênaie, le Bourg de Vière, les Coteaux, les campagnes.
- Une audience par média et par quartier.
- Un cahier de doléances par quartier.

**Ce qui manque**
- **Des variables visibles pour chaque quartier**, comme dans une fiche de province :
  - population et part des électeurs inscrits ;
  - sociologie (ouvriers, employés, cadres, retraités, agriculteurs, commerçants) ;
  - premier souci ;
  - vote en 1977 et intention de vote actuelle ;
  - niveau d'équipement : école, voirie, éclairage, transport.
- **Des départs asymétriques.** Saint-Aubin-sur-Vière est aujourd'hui la seule commune jouable. Trois profils de départ changeraient l'expérience autant qu'un petit duché face à un empire :

| Départ | Taille | Profil | Difficulté propre |
|---|---|---|---|
| Saint-Aubin-sur-Vière, ville moyenne | ~25 000 habitants | Mixte : cité HLM, bourg ancien, coteaux résidentiels | Équilibre, la commune actuelle |
| Le Mesnil-sur-Vière, commune rurale | ~3 000 habitants | Agriculteurs, commerçants, notables | Peu de budget, tout se joue sur les relations personnelles ; sous le seuil de 3 500 habitants, le scrutin reste majoritaire avec panachage |
| Vière-les-Forges, ville ouvrière | ~40 000 habitants | Usine sidérurgique en crise, syndicats forts | Fermeture d'usine menaçante, fiscalité tendue, grèves |

**Assets et textes possibles**
- Fiche de quartier : 5 icônes (population, sociologie, souci, vote, équipement).
- Un texte d'ambiance de 3 à 4 phrases par quartier, pour l'infobulle de la carte.
- Des fiches de départ (nom, texte de présentation, image d'en-tête) pour les deux communes supplémentaires.

---

## 2. Les 4 flux à l'échelle macro

### 2.1 Économie et logistique : les ressources et le coût d'opportunité

**Déjà dans le jeu :** la caisse en unités U, les impôts, les emprunts, l'entretien des services et l'adjoint aux finances. Un meeting coûte 0,15 U.

**Les ressources proposées**, chacune avec son coût d'opportunité :

| Ressource | Ce qu'elle représente | On la dépense pour | On la gagne par |
|---|---|---|---|
| **Caisse (U)** | Budget communal | Projets, entretien, meetings, tracts | Impôts, emprunts, subventions |
| **Temps du maire** | Agenda (2 rendez-vous par mois en campagne) | Rencontres, conseils, entretiens, meetings | Ne s'accumule pas : ce qui n'est pas fait est perdu |
| **Capital politique** | Crédit auprès des élus et des partis | Discipline de la majorité, faveurs, postes | Promesses tenues, victoires au conseil |
| **Confiance des quartiers** | Opinion locale | Hausse d'impôts, travaux gênants | Projets livrés, doléances traitées |

**Le coût d'opportunité en exemple :** un rendez-vous avec FR3 en février 1983, c'est un meeting de moins aux Tilleuls. Une école neuve financée par emprunt alimente la question « Emprunts du mandat » des journalistes.

### 2.2 Diplomatie profonde : les relations politiques

**Déjà dans le jeu :**
- les rencontres en tête à tête (courtoisie, alliances, délibérations, influence) ;
- les alliances calculées ;
- la discipline de la majorité ;
- les 6 délégations façon conseil de Crusader Kings 3.

Les équivalents des mécaniques du guide :

| Mécanique du guide | Équivalent à Saint-Aubin | État |
|---|---|---|
| Alliances complexes | Accords de liste (union de la gauche, union RPR-UDF), fusion de listes entre les deux tours | À étendre au second tour |
| Mariages royaux | Ralliements de notables : président du club de foot, curé, directeur d'usine, président de la FNSEA locale | À créer |
| Pactes de non-agression | Accords de désistement, ou trêve tacite avec un groupe d'opposition sur un dossier | À créer |
| Réseaux d'espionnage | « Bruits de couloir » : un conseiller informateur vous prévient d'une défection ou d'une attaque de Carminati | À créer |
| Coalitions | Les opposants s'unissent contre un maire trop puissant (voir le pilier 4) | À créer |
| Acteurs extérieurs | Préfecture (contrôle de légalité depuis 1982), conseil général, député, syndicats, associations de parents d'élèves | À étendre |

### 2.3 Guerre d'usure : la campagne comme guerre abstraite

**Déjà dans le jeu :** l'agenda médiatique, les entretiens, les meetings, le débat télévisé, les tracts et les sondages. Le score devient des intentions de vote par quartier.

**L'idée :** traiter la campagne comme une guerre d'usure.
- **Les « armées » sont les militants.** C'est un stock limité, recruté dans les quartiers où l'on est fort ; on l'envoie tracter, coller des affiches ou faire du porte-à-porte.
- **L'attrition :** les militants s'épuisent au fil des semaines. L'hiver 1982-1983 et la pluie réduisent le porte-à-porte, comme le terrain et le climat dans le guide.
- **Le front :** chaque quartier est disputé. Une carte « front électoral » montre l'écart entre le maire et Carminati, quartier par quartier.
- **Le ravitaillement :** chaque permanence ouverte dans un quartier coûte de la caisse et donne un bonus d'efficacité aux militants qui y travaillent.

### 2.4 Politique interne : pouvoir s'effondrer de l'intérieur

**Déjà dans le jeu :** les délibérations rejetées, les élus qui quittent la majorité, les cortèges et manifestations, les adjoints médiocres.

**À ajouter**
- **Une jauge de stabilité de la majorité.** Sous un seuil, plusieurs conséquences possibles :
  - motion de défiance ;
  - démission collective d'adjoints ;
  - budget rejeté, et le préfet qui règle le budget d'office après avis de la chambre régionale des comptes. C'est la procédure réelle, issue de la loi du 2 mars 1982 et aujourd'hui à l'article L1612-2 du CGCT.
- **Une liste dissidente :** un adjoint évincé monte sa propre liste en 1983.
- **Le parti national :** les consignes nationales (le tournant de la rigueur en mars 1983) peuvent aller contre les promesses locales du maire.

---

## 3. La boucle de jeu : l'émergence par les systèmes

### 3.1 L'effet papillon : des chaînes déjà possibles

Le moteur de faits du mandat (`faits_mandat()`) relie déjà les décisions à la campagne. Ces chaînes sont à rendre explicites dans les textes :

1. **Les impôts.** Une hausse des impôts de 8 % provoque la grogne dans les Coteaux. Odile Ferrand (La Dépêche, mordant 6) en fait sa première question. Carminati la reprend au débat.
2. **L'emprunt.** Un emprunt pour la piscine laisse moins de marge en 1982. La voirie se dégrade, et Lucien Brac (L'Écho du canton) titre sur les nids-de-poule du Bourg.
3. **Les élus.** Refuser un poste promis à un conseiller le fait passer dans l'opposition. Une délibération est alors rejetée, et Michel Garnier (FR3) vous interroge sur la majorité.
4. **Les doléances.** Une lettre sans réponse aux Tilleuls provoque l'interpellation du porte-parole en meeting. Radio Vière FM amplifie l'affaire (audience ×1,4 aux Tilleuls).

### 3.2 Le récit émergent : événements historiques et crises

Ce sont des événements réels de la période, qui touchent une commune. La session cloud peut les écrire en entier : titre, texte, choix, effets proposés.

| Date | Événement réel | Effet possible sur Saint-Aubin |
|---|---|---|
| 10 mai 1981 | Élection de François Mitterrand | Les militants de gauche sont galvanisés, les notables inquiets |
| 9 octobre 1981 | Abolition de la peine de mort | Débat au café du Bourg, rien d'officiel |
| 9 novembre 1981 | Loi sur les radios libres | Création de Radio Vière FM : on peut la soutenir ou l'ignorer |
| Janvier 1982 | 39 heures et 5e semaine de congés payés | Les agents municipaux demandent la réorganisation des services |
| 13 février 1982 | Loi de nationalisation | L'usine locale passe sous contrôle public : espoir ou inquiétude |
| 2 mars 1982 | Loi Defferre (décentralisation) | Fin de la tutelle du préfet *a priori* ; plus de liberté, plus de responsabilité |
| Mars 1982 | Retraite à 60 ans (ordonnance) | Les retraités deviennent un électorat qui grandit |
| Juin 1982 | Blocage des prix et des salaires, 2e dévaluation | Les commerçants du Bourg grognent ; les coûts des chantiers sont gelés |
| 19 novembre 1982 | Nouvelle loi électorale municipale (prime majoritaire et proportionnelle pour les communes de 3 500 habitants ou plus) | L'opposition aura des élus au conseil en 1983 : cela change les calculs de liste |
| 6 et 13 mars 1983 | Municipales | Le scrutin |
| 21 mars 1983 | Tournant de la rigueur | Hors du jeu (après le vote), possible épilogue |

**Les crises locales aléatoires**, sans date fixe :
- inondation de la Vière ;
- fermeture d'une classe ;
- scandale de marché public ;
- grève des éboueurs ;
- incendie d'un entrepôt ;
- départ du médecin du Bourg ;
- fermeture annoncée d'un atelier de l'usine ;
- affaire de logement HLM aux Tilleuls.

*Les dates sont à revérifier avant intégration ; les deux sessions doivent signaler toute erreur.*

---

## 4. L'IA : des adversaires rationnels avec une personnalité

**Déjà dans le jeu :** Jean-Louis Carminati au débat ; des élus avec métier, compétences, ambition et relations.

**Proposition :** donner une fiche de personnalité à chaque acteur que l'ordinateur pilote.

| Acteur | Priorité | Style | Faiblesse exploitable |
|---|---|---|---|
| Jean-Louis Carminati, chef de l'opposition | Gagner la mairie | Attaque sur le pire du bilan (déjà fait) ; promet des baisses d'impôts | Surenchère : ses promesses sont chiffrables |
| Un notable centriste | Garder son influence | Monnaye son ralliement entre les deux tours | Vanité : un poste d'adjoint le décide |
| Un militant communiste de l'usine | Défendre l'emploi | Mobilise les cortèges | N'accepte aucun compromis sur l'usine |
| Le préfet | Légalité, ordre public | Contrôle les délibérations | Prévisible, suit la loi |
| Le conseiller général du canton | Ses propres projets | Promet des subventions contre un soutien | Sa réélection en 1985 (cantonales) |

**Les freins contre la boule de neige**, quand le maire devient trop fort :
- **Usure du pouvoir :** au-delà d'un mandat réussi, les attentes montent et les journalistes deviennent plus mordants.
- **Coalition des opposants :** si le maire dépasse 60 % d'intentions de vote, la droite et les dissidents fusionnent leurs listes.
- **Ambitions internes :** un adjoint brillant devient un rival (successions façon Crusader Kings).
- **Normalisation de la presse :** un fait déjà réglé ne revient plus, mais un fait esquivé revient plus fort (déjà dans le jeu).

---

## 5. Accessibilité et ergonomie : ne pas devenir un « tableur Excel »

**Déjà dans le jeu :**
- un tutoriel de 24 étapes ;
- 13 explications au premier contact (`aides.json`) ;
- une taille de texte réglable ;
- la chance, le gain et le risque affichés sur chaque réponse.

### Les infobulles imbriquées

Chaque chiffre de l'interface explique sa source au survol, et les mots soulignés ouvrent une deuxième infobulle. Exemple :

> **Intentions de vote aux Tilleuls : 46 %** (+3 ce mois-ci)
> - +4 Entretien sur <u>Radio Vière FM</u> (audience ×1,4 ici)
> - +1 Doléance traitée : éclairage de la rue des Acacias
> - −2 <u>Hausse des impôts</u> de 5 %

Survoler « Hausse des impôts » ouvre : *« Votée au conseil du 12 mars 1982. Chaque point au-delà de 3 % coûte de la confiance dans tous les quartiers, deux fois plus aux Coteaux (propriétaires). »*

### Les modes de carte

| Mode | Couleur des quartiers | Raccourci proposé |
|---|---|---|
| Politique | Intentions de vote (maire contre Carminati) | 1 |
| Sociologie | Catégorie dominante | 2 |
| Soucis | Premier souci du quartier | 3 |
| Budget | Dépense municipale par habitant | 4 |
| Médias | Audience du média choisi | 5 |
| Front électoral (campagne) | Écart et quartiers basculants | 6 |

**Assets à produire :**
- 6 icônes de modes de carte, dans la palette du jeu ;
- les légendes de chaque mode ;
- tous les textes d'infobulles.

---

## Ce que la session cloud peut livrer ensuite

Il faut d'abord l'extrait du format JSON de chaque fichier, demandé à la session Godot.

1. Les textes des 11 événements historiques et des 8 crises locales : titre, texte, 2 ou 3 choix, effets proposés.
2. Les infobulles imbriquées des indicateurs de la barre du haut et de la fiche de quartier.
3. Les fiches de personnalité des acteurs pilotés par l'ordinateur.
4. Les textes d'ambiance des quartiers et les deux communes de départ supplémentaires.
5. Les sons du pilier 2.3 (foule, militants, pluie) et les icônes des modes de carte, suivis dans `Politics_assets.xlsx`.

Les décisions de mécanique (nouvelles ressources, militants, stabilité, communes supplémentaires) reviennent à Yannick : ce document les propose, il ne les impose pas.
