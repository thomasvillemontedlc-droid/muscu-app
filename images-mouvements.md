# Images des échauffements et étirements

L'app affiche une illustration pour chaque mouvement d'échauffement et
d'étirement, si le fichier existe. Sans fichier, rien ne s'affiche.

## Comment ajouter une image

1. Crée l'image (prompt type plus bas).
2. Nomme-la **exactement** comme dans la colonne "Fichier" (PNG ou JPG).
3. Dépose-la dans `public/mouvements/`.
4. Elle est convertie en WebP automatiquement au prochain build.

Le Rameur utilise déjà `public/exercices/rameur.*` s'il existe.

## Prompt type

Même style que les images d'exercices (fond clair, personnage en tenue de
sport, position de départ et position finale, 3 ou 4 conseils numérotés) :

> Illustration pédagogique sur fond clair, style infographie, titre en haut
> "<NOM DU MOUVEMENT>". Un personnage en tenue de sport montre le mouvement :
> position de départ à gauche, position finale à droite, flèche entre les
> deux. En bas, 3 vignettes numérotées avec un conseil court en français
> (respiration, posture, amplitude). Format carré.

## Priorité 1 : échauffement proposé par défaut (18 images)

| Mouvement | Fichier |
|---|---|
| Rameur | `rameur.png` |
| Rotations des bras, grands cercles | `rotations-des-bras-grands-cercles.png` |
| Rotations des bras et tirage élastique léger | `rotations-des-bras-et-tirage-elastique-leger.png` |
| Haussements d'épaules | `haussements-d-epaules.png` |
| Rotations des épaules | `rotations-des-epaules.png` |
| Rotations des poignets et des coudes | `rotations-des-poignets-et-des-coudes.png` |
| Extensions légères des bras au-dessus de la tête | `extensions-legeres-des-bras-au-dessus-de-la-tete.png` |
| Rotations des poignets | `rotations-des-poignets.png` |
| Flexions légères des coudes | `flexions-legeres-des-coudes.png` |
| Enroulements du buste à vide | `enroulements-du-buste-a-vide.png` |
| Montées de genoux | `montees-de-genoux.png` |
| Rotations du buste | `rotations-du-buste.png` |
| Chat-vache (mobilité du dos) | `chat-vache-mobilite-du-dos.png` |
| Squats à vide | `squats-a-vide.png` |
| Fentes avant à vide | `fentes-avant-a-vide.png` |
| Montées sur pointes de pieds | `montees-sur-pointes-de-pieds.png` |
| Cercles de hanches | `cercles-de-hanches.png` |
| Jumping jacks ou marche sur place | `jumping-jacks-ou-marche-sur-place.png` |

## Priorité 1 : étirements de fin de séance (35 images)

| Étirement | Muscle | Fichier |
|---|---|---|
| Bras tendu contre un mur, buste tourné à l’opposé | Pectoraux | `bras-tendu-contre-un-mur-buste-tourne-a-l-oppose.png` |
| Avant-bras posé sur l’encadrement d’une porte, léger pas en avant | Pectoraux | `avant-bras-pose-sur-l-encadrement-d-une-porte-leger-pas-en-avant.png` |
| Bras tendus, mains jointes derrière le dos, tirées vers le haut | Pectoraux | `bras-tendus-mains-jointes-derriere-le-dos-tirees-vers-le-haut.png` |
| Bras tendus devant soi, dos rond, mains tirées vers l’avant-bas | Dorsaux | `bras-tendus-devant-soi-dos-rond-mains-tirees-vers-l-avant-bas.png` |
| À quatre pattes, dos rond puis creux (étirement du chat) | Dorsaux | `a-quatre-pattes-dos-rond-puis-creux-etirement-du-chat.png` |
| Suspension passive à une barre, corps relâché | Dorsaux | `suspension-passive-a-une-barre-corps-relache.png` |
| Main sur la tête, tirer doucement sur le côté | Trapèzes | `main-sur-la-tete-tirer-doucement-sur-le-cote.png` |
| Tête inclinée, bras opposé tenu dans le dos | Trapèzes | `tete-inclinee-bras-oppose-tenu-dans-le-dos.png` |
| Bras tendu devant la poitrine, tiré avec l’autre bras | Deltoïdes | `bras-tendu-devant-la-poitrine-tire-avec-l-autre-bras.png` |
| Bras plié derrière la tête, main sur le coude, poussée légère | Deltoïdes | `bras-plie-derriere-la-tete-main-sur-le-coude-poussee-legere.png` |
| Bras tendu, paume au mur, buste tourné à l’opposé | Biceps | `bras-tendu-paume-au-mur-buste-tourne-a-l-oppose.png` |
| Bras tendus, mains jointes derrière le dos, légèrement levés | Biceps | `bras-tendus-mains-jointes-derriere-le-dos-legerement-leves.png` |
| Coude plié, main dans le dos, poussée légère avec l’autre main | Triceps | `coude-plie-main-dans-le-dos-poussee-legere-avec-l-autre-main.png` |
| Bras tendu, paume vers le haut, doigts tirés vers soi | Avant-bras | `bras-tendu-paume-vers-le-haut-doigts-tires-vers-soi.png` |
| Bras tendu, paume vers le bas, doigts tirés vers soi | Avant-bras | `bras-tendu-paume-vers-le-bas-doigts-tires-vers-soi.png` |
| Bras tendu, paume vers le bas, poignet fléchi vers le sol | Brachial | `bras-tendu-paume-vers-le-bas-poignet-flechi-vers-le-sol.png` |
| Allongé sur le ventre, buste relevé en appui sur les avant-bras (cobra) | Abdos haut | `allonge-sur-le-ventre-buste-releve-en-appui-sur-les-avant-bras-cobra.png` |
| Debout, mains dans le bas du dos, légère extension arrière | Abdos haut | `debout-mains-dans-le-bas-du-dos-legere-extension-arriere.png` |
| Debout, bras levé, buste incliné sur le côté | Obliques | `debout-bras-leve-buste-incline-sur-le-cote.png` |
| Allongé, ramener les deux genoux vers la poitrine | Lombaires | `allonge-ramener-les-deux-genoux-vers-la-poitrine.png` |
| Allongé, genoux pliés basculés d’un côté, bras en croix (torsion) | Lombaires | `allonge-genoux-plies-bascules-d-un-cote-bras-en-croix-torsion.png` |
| À genoux, buste posé vers l’avant, bras tendus (posture de l’enfant) | Lombaires | `a-genoux-buste-pose-vers-l-avant-bras-tendus-posture-de-l-enfant.png` |
| Debout, talon vers la fesse, genoux joints | Quadriceps | `debout-talon-vers-la-fesse-genoux-joints.png` |
| Allongé sur le côté, même mouvement, utile si l’équilibre est difficile | Quadriceps | `allonge-sur-le-cote-meme-mouvement-utile-si-l-equilibre-est-difficile.png` |
| Assis, jambe tendue, buste penché vers l’avant | Ischio-jambiers | `assis-jambe-tendue-buste-penche-vers-l-avant.png` |
| Debout, jambe posée sur un support bas, buste penché vers l’avant | Ischio-jambiers | `debout-jambe-posee-sur-un-support-bas-buste-penche-vers-l-avant.png` |
| Allongé, jambe tendue vers le plafond, mains derrière la cuisse | Ischio-jambiers | `allonge-jambe-tendue-vers-le-plafond-mains-derriere-la-cuisse.png` |
| Assis, cheville sur le genou opposé, buste penché (figure 4) | Fessiers | `assis-cheville-sur-le-genou-oppose-buste-penche-figure-4.png` |
| Allongé sur le dos, genou ramené vers l’épaule opposée | Fessiers | `allonge-sur-le-dos-genou-ramene-vers-l-epaule-opposee.png` |
| Jambe avant pliée, jambe arrière tendue, buste penché (pigeon) | Fessiers | `jambe-avant-pliee-jambe-arriere-tendue-buste-penche-pigeon.png` |
| Mains au mur, jambe arrière tendue, talon au sol | Mollets | `mains-au-mur-jambe-arriere-tendue-talon-au-sol.png` |
| Talon dans le vide sur une marche, poids du corps vers l’avant | Mollets | `talon-dans-le-vide-sur-une-marche-poids-du-corps-vers-l-avant.png` |
| Assis, plantes de pieds jointes, genoux poussés vers le sol (papillon) | Adducteurs | `assis-plantes-de-pieds-jointes-genoux-pousses-vers-le-sol-papillon.png` |
| Fente latérale, poids sur une jambe | Adducteurs | `fente-laterale-poids-sur-une-jambe.png` |
| Debout, une jambe croisée devant l’autre, buste penché sur le côté | Abducteurs | `debout-une-jambe-croisee-devant-l-autre-buste-penche-sur-le-cote.png` |

## Priorité 2 : alternatives d'échauffement (23 images)

Proposées seulement via "Ajouter un mouvement".

| Mouvement | Fichier |
|---|---|
| Ouvertures de bras (swings horizontaux) | `ouvertures-de-bras-swings-horizontaux.png` |
| Pompes contre un mur | `pompes-contre-un-mur.png` |
| Tirage élastique léger | `tirage-elastique-leger.png` |
| Étirement actif 'chat-vache' | `etirement-actif-chat-vache.png` |
| Cercles des épaules | `cercles-des-epaules.png` |
| Rotations douces de la nuque | `rotations-douces-de-la-nuque.png` |
| Élévations latérales à vide | `elevations-laterales-a-vide.png` |
| Cercles de bras | `cercles-de-bras.png` |
| Flexions légères des coudes à vide | `flexions-legeres-des-coudes-a-vide.png` |
| Rotations des bras | `rotations-des-bras.png` |
| Étirements des poignets | `etirements-des-poignets.png` |
| Rotations des avant-bras | `rotations-des-avant-bras.png` |
| Mini-crunchs à vide | `mini-crunchs-a-vide.png` |
| Montées de genoux lentes | `montees-de-genoux-lentes.png` |
| Gainage léger (15s) | `gainage-leger-15s.png` |
| Flexions latérales du buste | `flexions-laterales-du-buste.png` |
| Rotations du bassin | `rotations-du-bassin.png` |
| Balancements de jambe | `balancements-de-jambe.png` |
| Pont fessier à vide | `pont-fessier-a-vide.png` |
| Sautillements légers | `sautillements-legers.png` |
| Fentes latérales à vide | `fentes-laterales-a-vide.png` |
| Marche latérale (pas chassés) | `marche-laterale-pas-chasses.png` |
| Corde à sauter légère | `corde-a-sauter-legere.png` |
