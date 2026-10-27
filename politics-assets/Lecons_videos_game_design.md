# Politics : les leçons de trois vidéos de game design

*Document de la session cloud « Assets Politics jeu », 27 octobre 2026. Il complète `GSG_applique_a_Politics.md`.*

Les trois vidéos partagées par Yannick :
1. **« J'ai recréé le jeu des pubs fake »**, avec Dan : le jeu mobile Real Pins, le soin du rendu (le « juice »), la monétisation et la publicité.
2. **GDMK, « 5 bases du game design »** : la forme suit la fonction, les mécaniques cœur, la boucle de jeu, les signes et feedbacks, le challenge.
3. **« 10 erreurs de game design », 1re partie** : tutoriel, difficulté, trop de fonctionnalités, signes et feedbacks négligés, caméra.

Certaines règles visent le jeu mobile gratuit (publicité, achats). Politics est un jeu de stratégie sur PC : on ne garde que ce qui s'applique, et on le dit quand ce n'est pas le cas.

---

## 1. La forme suit la fonction

**La règle (vidéo 2) :** d'abord rendre le jeu amusant avec des formes simples, ensuite l'habiller. La forme doit montrer la fonction, comme un personnage fin qui se lit tout de suite comme rapide.

**Pour Politics**
- Les portraits, les décors et le poste de télévision de 1980 sont déjà faits (Higgsfield). C'est de la forme.
- La forme doit maintenant **montrer la fonction d'un coup d'œil** :
  - un élu loyal et un élu prêt à trahir ne doivent pas se ressembler sur sa carte de personnage (cadre, couleur, icône) ;
  - un journaliste mordant (Garnier, 7) doit avoir l'air plus dur qu'un journaliste conciliant (Brac, 3) : expression, cadrage, couleur du bandeau.
- **Règle à suivre pour tout nouvel asset :** avant de le chercher ou de le générer, écrire en une ligne quelle information il doit faire passer au joueur. Une colonne « fonction » est ajoutée au tableur.

## 2. La mécanique cœur : ce que le joueur fait 80 % du temps

**La règle (vidéo 2) :** si l'action de base n'est pas agréable, le reste ne sert à rien. Mario, c'est se déplacer et sauter ; une course, c'est accélérer, freiner et tourner.

**Pour Politics**, l'action de base comporte deux temps :
- **Pendant le mandat :** faire passer un dossier, avec les mêmes étapes que le tutoriel : proposer, inscrire, rencontrer les élus, faire voter.
- **Pendant la campagne :** répondre à une question, en choisissant entre assumer, défendre, contre-attaquer, esquiver ou promettre.

**Conséquence :** ces deux gestes méritent le plus de soin. Il faut des sons, des animations, des textes variés et un résultat lisible à chaque fois, avant d'ajouter des fonctionnalités. Les propositions du document GSG (militants, communes de départ en plus, jauge de stabilité) passent après (voir § 6).

## 3. Les boucles de jeu : objectif, challenge, récompense

**La règle (vidéo 2) :** chaque boucle a un objectif clair, un challenge et une récompense qui aide pour la suite. Il y a des boucles petites, moyennes et grandes. Oublier la récompense est une erreur de game design.

Les boucles de Politics :

| Boucle | Durée | Objectif | Challenge | Récompense, à rendre visible |
|---|---|---|---|---|
| **Micro** : une réplique en rencontre ou en entretien | Quelques secondes | Convaincre | Chance affichée, risque | Expression du personnage qui change, son, chiffre qui bouge |
| **Courte** : un dossier | Quelques minutes | Faire voter une mesure | Trouver la majorité au conseil | Vote gagné, animation du résultat, une ligne dans le journal |
| **Moyenne** : un mois de jeu | Une session | Équilibrer budget, opinion et majorité | Les événements, les doléances | Le journal du mois et les sondages qui montent |
| **Longue** : le mandat jusqu'aux municipales de 1983 | La partie | Être réélu | Rendre des comptes en campagne | Soirée électorale, bilan, titre de la presse |

**À vérifier dans le jeu :**
- Chaque boucle a-t-elle sa récompense visible ? La soirée électorale du 13 mars 1983 doit être le grand moment de récompense, ou de défaite : sons de foule, une de journal, résultats quartier par quartier.
- Un vote gagné au conseil doit se « sentir » : coup de marteau, applaudissements de la majorité, mesure tamponnée « adoptée ».

## 4. Les signes et les feedbacks : le langage du jeu

**La règle (vidéos 2 et 3) :**
- À chaque action, le joueur doit savoir ce qu'il peut faire, s'il l'a fait, et si c'était bien ou mal.
- Le joueur ne doit jamais se dire « je ne comprends pas pourquoi j'ai perdu ».
- Les bons studios tiennent un **tableau des signes et feedbacks** : visuel, animation, son, vibration.

**Pour Politics**, ce tableau est ajouté au tableur (onglet « Signes et feedback »). Il recense pour chaque action :
- le signe avant l'action ;
- le feedback après, en cas de réussite ou d'échec ;
- les assets nécessaires.

C'est la liste la plus directement utile pour la partie assets : elle dit quels sons et quelles animations manquent. Quelques exemples :

| Action | Signe avant | Feedback réussite | Feedback échec |
|---|---|---|---|
| Faire voter une délibération | Décompte des voix prévues (pour, contre, incertains) | Coup de marteau, applaudissements, tampon « Adoptée » | Brouhaha, tampon « Rejetée », nom des élus qui ont lâché |
| Répondre à un journaliste | Chance, gain et risque (déjà là) | Hochement de tête, chiffre vert, stylo qui note | Sourcil levé, relance, chiffre rouge |
| Meeting de quartier | Le souci du quartier est affiché | Applaudissements qui montent | Huées, chaises qui grincent |
| Le mois passe | Bouton « mois suivant » | Bruit de rotative, journal qui tombe | — |
| Élu qui quitte la majorité | Alerte « bruits de couloir » avant | — | Porte qui claque, portrait qui passe dans l'opposition |

**Le « pourquoi » d'une défaite :** chaque perte de voix doit pouvoir se remonter jusqu'à sa cause, grâce aux infobulles imbriquées du document GSG, § 5. C'est la même règle vue sous deux angles.

## 5. Le challenge et le flow : la courbe de difficulté

**La règle (vidéos 2 et 3) :**
- Facile au début, de plus en plus dur ensuite. Trop facile, on s'ennuie ; trop dur, on est frustré.
- Plusieurs modes de difficulté.
- Alterner les moments durs et les moments de répit.
- Mesurer les défaites des testeurs.
- « Le game designer veut battre le joueur » est une erreur.

**Pour Politics**
- **Le mandat a déjà une courbe naturelle** :
  - 1977-1978 : la lune de miel, une majorité docile, peu d'événements ;
  - 1979-1981 : la crise, avec les premières grèves et le budget tendu ;
  - 1981-1982 : l'accélération nationale (élection de Mitterrand, décentralisation) ;
  - septembre 1982 à mars 1983 : la campagne, où l'on rend des comptes.

  Il faut la rendre explicite dans les réglages : peu d'événements et des élus conciliants au début, puis une montée progressive.
- **Les modes de difficulté :** le bac à sable existe déjà, avec des élus conciliants et moins d'événements. Proposition : trois niveaux nommés dans l'esprit du jeu : *Conseiller* (facile), *Maire* (normal), *Préfet de fer* (difficile).
- **Le répit :** après une crise (grève, inondation), prévoir un mois calme, avec un événement positif possible comme une inauguration ou une subvention.
- **La mesure :** le simulateur de la session Godot joue déjà des parties. Il peut compter les taux de réélection par niveau de difficulté, y compris avec la campagne, que le rapport du 24 octobre signale comme non encore simulée.

## 6. Ne pas empiler les fonctionnalités

**La règle (vidéo 3) :** chaque nouvelle fonctionnalité complique le jeu et le développement, et peut déséquilibrer ce qui marche. Pour chacune, il faut se demander : est-elle vraiment utile ? Dans l'exemple de la vidéo, un prototype simple a fait 15 millions de parties.

**Pour Politics**, c'est un garde-fou pour le document GSG. Le jeu a déjà beaucoup de systèmes : conseil, délégations, rencontres, doléances, mouvements sociaux, budget, presse, campagne.

Classement proposé des idées du document GSG :

| Priorité | Idée | Pourquoi |
|---|---|---|
| **1. Tout de suite** | Signes et feedbacks, infobulles imbriquées, modes de carte | Rendent lisibles les systèmes qui existent déjà, sans en ajouter |
| **2. Ensuite** | Événements historiques et crises locales | Du contenu, pas un nouveau système : ils passent par le moteur d'événements existant |
| **3. Ensuite** | Fiches de personnalité des adversaires | Enrichit la campagne existante |
| **4. Plus tard, à tester** | Jauge de stabilité de la majorité | Proche de systèmes existants (discipline, défections) : vérifier qu'elle n'est pas en double |
| **5. Peut-être jamais** | Militants et front électoral, communes de départ en plus | Nouveaux systèmes lourds, à décider seulement si le cœur du jeu est déjà agréable |

## 7. Le tutoriel

**La règle (vidéo 3) :** le joueur ne connaît pas le jeu et ne lit pas les textes. Le tutoriel le fait jouer étape par étape, sans le punir au début, et présente les objectifs à court, moyen et long terme.

**Pour Politics**, c'est déjà bien couvert :
- un tutoriel de 24 étapes ;
- un premier dossier fait par le joueur lui-même ;
- 13 explications au premier contact.

À ajouter :
- **Les trois horizons dès le départ :** « Ce mois-ci : faire voter le budget. Cette année : tenir deux promesses. En mars 1983 : être réélu ».
- **Une première année sans punition :** pas de crise grave avant le premier budget voté.
- **Des textes plus courts :** les explications de `aides.json` ne doivent pas dépasser 2 ou 3 phrases. La session cloud peut les réécrire.

## 8. La caméra, ou ici la lisibilité de l'écran

**La règle (vidéo 3) :** une caméra mal réglée cache l'essentiel. Même une vue fixe doit montrer les éléments importants, au bon zoom.

**Pour Politics**, jeu en 2D à base de carte et de panneaux, la « caméra », c'est :
- **le zoom de la carte :** vue commune pour les modes de carte, vue quartier pour les doléances et les meetings ;
- **les panneaux :** un panneau ouvert ne doit jamais cacher l'information qu'il commente. Par exemple, la fiche d'un quartier ne doit pas recouvrir le quartier lui-même sur la carte ;
- **les cadrages des scènes** (studio TV, radio, salle de meeting) : le journaliste et le maire sont tous les deux visibles, et le cadrage se resserre pendant le débat pour faire monter la tension, comme dans l'exemple de la vidéo.

## 9. Ce que la vidéo « pub fake » apporte, et ce qu'elle n'apporte pas

**Ce qui s'applique**
- **Le « juice » :** couleurs, effets de post-traitement, mouvements de caméra quand on agit, vibrations. Pour Politics, c'est la version sobre de la même idée :
  - un léger zoom ou une secousse de la caméra quand un vote tombe ;
  - le grain de télévision de 1980 sur FR3 (le poste existe déjà) ;
  - des sons sourds et satisfaisants : tampon, marteau, rotative.

  Les palettes doivent rester dans la direction artistique des années 1980 : pas de couleurs fluo à la manière des jeux mobiles.
- **Pas d'écran noir au lancement :** l'introduction de venatior_X studio existe déjà.
- **Jouer tout de suite :** proposer « Continuer » en premier sur le menu, pour reprendre la dernière sauvegarde en un clic.
- **Varier les situations,** comme les niveaux de Real Pins qui ne se résolvent pas tous de la même façon. Les questions des journalistes et les événements ne doivent pas toujours se régler avec la même réponse. Les cinq réponses existent déjà ; il faut des textes variés pour que le joueur ne repère pas une recette.
- **Le marketing :** le calcul coût par installation contre revenu par joueur s'applique si le jeu est un jour vendu, par exemple sur Steam. Les moments à montrer dans une bande-annonce sont ceux qui se comprennent en 5 secondes : le débat télévisé face à Carminati, un vote serré au conseil, la soirée électorale.

**Ce qui ne s'applique pas**
- Faire perdre le joueur exprès pour vendre des bonus ou montrer des publicités, les publicités forcées, le bouton « no ads ». C'est le modèle économique du jeu mobile gratuit, et la vidéo elle-même montre qu'il a mal marché. Pour un jeu de stratégie sur PC, la défaite doit être juste et compréhensible (§ 4 et 5), jamais un levier de vente.

## 10. Quatrième vidéo : « Racine », un jeu de gestion en 4 mois

C'est un projet d'étudiants : 10 personnes, 4 mois, un jeu de gestion de colonie sur PC. Leurs leçons, appliquées à Politics :

### 10.1 Les game pillars : trois idées directrices à fixer par écrit

Racine en a trois :
- l'univers et le contexte ;
- la symbolique, puisée dans une expérience réelle (pour eux, la fraternité entre potes) ;
- l'expérience voulue pour le joueur : drôle, avec une faible charge mentale mais de la profondeur.

Chaque décision d'équipe se vérifie contre eux.

**Proposition pour Politics**, à valider par Yannick :

| Pilier | Proposition |
|---|---|
| **Univers et contexte** | Une commune française fictive, Vière, de 1977 aux municipales de mars 1983, dans une histoire nationale réelle et exacte (alternance de 1981, décentralisation, radios libres) |
| **Symbolique** | Le pouvoir local au contact des gens : un maire connaît ses électeurs par leur nom et finit toujours par rendre des comptes |
| **Expérience du joueur** | La tension d'un vote serré et d'une question piège, dans un jeu de stratégie lisible : chaque chiffre s'explique et chaque défaite se comprend |

**Test pour toute nouvelle idée :** sert-elle au moins un pilier ? Sinon, elle sort (voir § 6).

### 10.2 Une seule référence, pas plusieurs

Leur intervenant leur a fait refaire un mois et demi d'interfaces : « Une seule référence, tu prendras. » Repartir de RimWorld seul a été bien plus efficace.

**Pour Politics :** Crusader Kings 3 sert déjà de modèle pour le conseil et les délégations. **CK3 devrait rester la référence unique pour l'interface** : fiches de personnage, infobulles imbriquées, modes de carte, alertes en haut de l'écran. Les autres jeux (Europa Universalis, Suzerain…) peuvent inspirer le ton des textes, pas l'interface.

### 10.3 Le narrative design au service du jeu

Dans Racine, l'humeur de l'arbre de vie *est* la barre de progression : il gagne des feuilles et des animations joyeuses à chaque niveau. Les ressources (sève, eau) collent à l'univers plutôt qu'au bois et au fer habituels.

**Pour Politics**, un équivalent visible de l'état de la commune :
- **La place de la mairie, en fond du bureau ou de la carte, qui change avec l'opinion :**
  - commune contente : fleurs aux fenêtres, marché animé, drapeaux ;
  - commune mécontente : affiches d'opposition, tags « Carminati maire », volets fermés, banderoles de grève.

  Trois ou quatre états suffisent, et c'est un vrai besoin d'assets (images Higgsfield, déclinées).
- **Le bureau du maire, qui se remplit au fil du mandat :** dossiers empilés, coupures de presse encadrées pour les succès, lettres en souffrance qui s'entassent pour les doléances non traitées.
- **Les noms des ressources,** dans le vocabulaire municipal de l'époque :
  - caisse ;
  - « crédit » auprès des élus ;
  - temps du maire ;
  - confiance des quartiers.

### 10.4 Les besoins, l'humeur et les événements

Leurs habitants ont des besoins (boire, dormir, s'amuser) qui font monter ou baisser leur humeur. Ils ont aussi des humeurs aléatoires (deux habitants qui se brouillent) qui créent de la tension. Un habitant malheureux trop longtemps s'en va.

**Pour Politics**, c'est déjà proche des doléances et des élus :
- **un quartier sans réponse trop longtemps bascule dans l'opposition** : le parallèle direct ;
- **les brouilles entre élus** (deux adjoints qui se fâchent) sont des événements aléatoires utiles à écrire.

### 10.5 La direction artistique et le son

**Ce que Racine a fait**
- Une bible graphique : les règles visuelles à suivre pour rester cohérent.
- Des icônes pour chaque ressource et chaque menu.
- Des contours au survol de chaque élément cliquable.
- Une musique avec une contrainte d'instruments (flûte, xylophone, harpe) et un **instrument signature** dans chaque morceau (une trompette jouée à la bouche).
- De petits détails de vie : poissons, oiseaux.

**Pour Politics**
- **La bible graphique :** à écrire avec la session Godot, qui connaît le style actuel des portraits et des décors. Elle fixera la palette des années 80, les polices, le cadre des portraits, le style des icônes et le grain télé. La session cloud peut en rédiger le brouillon à partir de captures d'écran.
- **Le brief musical,** proposé :
  - instruments de l'époque : synthétiseur analogique façon générique de journal télévisé, piano électrique, basse ;
  - **instrument signature : les cuivres d'une fanfare municipale,** présents dans chaque morceau, de la mairie à la campagne. Ils sonnent « fête de la commune » quand tout va bien, et « défilé de grève » en mineur quand ça va mal.
- **Les détails de vie sur la carte :** une 2CV ou une R5 qui passe, le marché le jeudi, le clocher qui sonne l'heure.

### 10.6 Ce que Politics a d'avance, et le risque partagé

Racine a manqué de temps pour trois choses : la sauvegarde, l'équilibrage et le tutoriel. Leurs testeurs avaient l'impression de jouer « à Civilization 6 en braille ».

Politics a déjà les trois :
- des sauvegardes, avec avertissement de version ;
- un simulateur d'équilibrage et 250 tests ;
- un tutoriel de 24 étapes.

C'est une vraie avance. Le risque commun est le même que le leur : **viser trop gros**. Cela confirme le classement du § 6 : finir et rendre lisible l'existant avant d'ajouter des systèmes.

---

## Ce que la session cloud livre ensuite

1. L'onglet « Signes et feedback » du tableur, à compléter avec la session Godot : c'est la liste des sons et animations à trouver.
2. La recherche des sons correspondants : marteau, tampon, rotative, porte qui claque, brouhaha de conseil, chaises.
3. La réécriture courte des explications de `aides.json` et l'écran des trois horizons, dès réception du format JSON.

Comme pour le document GSG, les décisions de mécanique et de priorité reviennent à Yannick.
