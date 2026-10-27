# Livraison de la session cloud « Assets Politics jeu »

Ce dossier contient les fichiers prêts à copier dans le jeu.

## audio/effets/ : 8 effets synthétisés

Ces sons sont **calculés** par `politics-assets/outils/synth_sons.py`, sans aucun échantillon extérieur. Ils ont été créés pour le projet et sont libres de droits : aucun crédit n'est obligatoire. Le script les régénère à l'identique (graine fixe 1983) et permet de retoucher les timbres.

| Fichier | Fiche sons.json | Durée | Description |
|---|---|---|---|
| `conseil_cloche.ogg` | conseil_cloche | 2,9 s | Petite cloche de séance, partiels inharmoniques, écho de salle |
| `vote_marteau.ogg` | vote_marteau | 0,45 s | Un coup de maillet en bois sur un bureau |
| `tampon.ogg` | tampon | 1,5 s | Choc sourd d'un tampon encreur, petit claquement du manche |
| `vote_adoptee.ogg` | vote_adoptee | 0,9 s | Fanfare courte en majeur, cuivres synthétiques |
| `vote_rejetee.ogg` | vote_rejetee | 1,4 s | Deux accords qui descendent, en mineur |
| `evenement.ogg` | evenement | 1,1 s | Alerte : deux accords de synthé en suspension |
| `jt_generique.ogg` | jt_generique | 2,5 s | Générique de journal télévisé, synthé analogique façon 1980 |
| `election_resultat.ogg` | election_resultat | 3,6 s | Roulement de caisse claire, puis accord de cuivres tenu |

Format : Ogg Vorbis, 44,1 kHz, mono, crête à −3 dBFS, fin naturelle avec la réverbération.

**Limite :** la session cloud ne peut pas écouter ses propres sons. Elle a vérifié les durées, les crêtes et les spectrogrammes, pas le rendu à l'oreille. **Yannick doit les écouter avant de les garder.** Ce sont des sons de remplacement honnêtes, pas des enregistrements de bruiteur.

## polices/

| Dossier | Usage | Fichiers | Licence |
|---|---|---|---|
| `spectral/` | Titres (remplace Palatino Linotype) | Regular, Italic, SemiBold, SemiBoldItalic, Bold | SIL OFL 1.1 (`OFL.txt`) |
| `source_sans_3/` | Interface et texte courant (remplace Segoe UI et la police de Godot) | Fichiers variables : graisses de 200 à 900, plus l'italique | SIL OFL 1.1 (`OFL.txt`) |

- **Source :** dépôt officiel Google Fonts (github.com/google/fonts, dossiers `ofl/spectral` et `ofl/sourcesans3`).
- **Spectral** est dessinée par Production Type, une fonderie française, pour l'écran.
- **Source Sans 3** vient d'Adobe ; elle reste très lisible en petite taille.
- **Aperçu :** `specimen_polices.png`, avec les accents, les guillemets « » et des textes du jeu.
- **Intégration :** l'OFL demande de livrer `OFL.txt` avec les polices ; une ligne dans LICENCES.txt suffit.
- **Graisses :** dans Godot 4, la police variable Source Sans 3 se règle par `variation_opentype` (axe `wght`). On peut aussi en tirer des variantes Regular et Bold dans le thème.
