import { getExerciseMuscles, getMuscleLabel, MUSCLE_GROUPS } from './muscleGroups.js'

// Base fournie par l'utilisateur (etirements-musculation.md, ~35
// étirements) : 2 à 3 par muscle pour varier d'une séance à l'autre,
// plutôt qu'un seul suggéré à chaque fois. brachial et obliques n'y
// figurent pas (absents du fichier) : ils gardent leur unique étirement
// d'origine en repli. Durées ramenées à une valeur unique représentative
// des fourchettes du fichier (ex: "20-30s" -> 25s) — le temps de maintien
// reste de toute façon modifiable avant de lancer (voir RoutineRunner.jsx).
const STRETCHES = {
  pectoraux: [
    { name: 'Bras tendu contre un mur, buste tourné à l’opposé', holdSeconds: 25 },
    { name: 'Avant-bras posé sur l’encadrement d’une porte, léger pas en avant', holdSeconds: 25 },
    { name: 'Bras tendus, mains jointes derrière le dos, tirées vers le haut', holdSeconds: 25 },
  ],
  dorsaux: [
    { name: 'Bras tendus devant soi, dos rond, mains tirées vers l’avant-bas', holdSeconds: 25 },
    { name: 'À quatre pattes, dos rond puis creux (étirement du chat)', holdSeconds: 25 },
    { name: 'Suspension passive à une barre, corps relâché', holdSeconds: 18 },
  ],
  trapezes: [
    { name: 'Main sur la tête, tirer doucement sur le côté', holdSeconds: 18 },
    { name: 'Tête inclinée, bras opposé tenu dans le dos', holdSeconds: 20 },
  ],
  deltoides: [
    { name: 'Bras tendu devant la poitrine, tiré avec l’autre bras', holdSeconds: 25 },
    { name: 'Bras plié derrière la tête, main sur le coude, poussée légère', holdSeconds: 25 },
  ],
  biceps: [
    { name: 'Bras tendu, paume au mur, buste tourné à l’opposé', holdSeconds: 25 },
    { name: 'Bras tendus, mains jointes derrière le dos, légèrement levés', holdSeconds: 25 },
  ],
  triceps: [{ name: 'Coude plié, main dans le dos, poussée légère avec l’autre main', holdSeconds: 25 }],
  'avant-bras': [
    { name: 'Bras tendu, paume vers le haut, doigts tirés vers soi', holdSeconds: 18 },
    { name: 'Bras tendu, paume vers le bas, doigts tirés vers soi', holdSeconds: 18 },
  ],
  brachial: [{ name: 'Bras tendu, paume vers le bas, poignet fléchi vers le sol', holdSeconds: 20 }],
  abdominaux: [
    { name: 'Allongé sur le ventre, buste relevé en appui sur les avant-bras (cobra)', holdSeconds: 25 },
    { name: 'Debout, mains dans le bas du dos, légère extension arrière', holdSeconds: 18 },
  ],
  obliques: [{ name: 'Debout, bras levé, buste incliné sur le côté', holdSeconds: 20 }],
  lombaires: [
    { name: 'Allongé, ramener les deux genoux vers la poitrine', holdSeconds: 25 },
    { name: 'Allongé, genoux pliés basculés d’un côté, bras en croix (torsion)', holdSeconds: 25 },
    { name: 'À genoux, buste posé vers l’avant, bras tendus (posture de l’enfant)', holdSeconds: 30 },
  ],
  quadriceps: [
    { name: 'Debout, talon vers la fesse, genoux joints', holdSeconds: 25 },
    { name: 'Allongé sur le côté, même mouvement, utile si l’équilibre est difficile', holdSeconds: 25 },
  ],
  'ischio-jambiers': [
    { name: 'Assis, jambe tendue, buste penché vers l’avant', holdSeconds: 25 },
    { name: 'Debout, jambe posée sur un support bas, buste penché vers l’avant', holdSeconds: 25 },
    { name: 'Allongé, jambe tendue vers le plafond, mains derrière la cuisse', holdSeconds: 25 },
  ],
  fessiers: [
    { name: 'Assis, cheville sur le genou opposé, buste penché (figure 4)', holdSeconds: 25 },
    { name: 'Allongé sur le dos, genou ramené vers l’épaule opposée', holdSeconds: 25 },
    { name: 'Jambe avant pliée, jambe arrière tendue, buste penché (pigeon)', holdSeconds: 30 },
  ],
  mollets: [
    { name: 'Mains au mur, jambe arrière tendue, talon au sol', holdSeconds: 25 },
    { name: 'Talon dans le vide sur une marche, poids du corps vers l’avant', holdSeconds: 25 },
  ],
  adducteurs: [
    { name: 'Assis, plantes de pieds jointes, genoux poussés vers le sol (papillon)', holdSeconds: 25 },
    { name: 'Fente latérale, poids sur une jambe', holdSeconds: 25 },
  ],
  abducteurs: [{ name: 'Debout, une jambe croisée devant l’autre, buste penché sur le côté', holdSeconds: 25 }],
}

// Muscles travaillés en PRINCIPAL par les exercices effectivement complétés
// d'une séance, dédupliqués, dans l'ordre standard MUSCLE_GROUPS.
export function getPrimaryMusclesWorked(session) {
  const completedIds = session.completedExerciseIds ?? session.entries.map((e) => e.exerciseId)
  const worked = new Set()

  for (const entry of session.entries) {
    if (!completedIds.includes(entry.exerciseId)) continue
    if (!entry.sets.some((set) => set.weight * set.reps > 0)) continue
    for (const muscleId of getExerciseMuscles(entry.exerciseName).primary) worked.add(muscleId)
  }

  return MUSCLE_GROUPS.filter((id) => worked.has(id))
}

// Suggestions d'étirements pour une liste de muscles (sortie de
// getPrimaryMusclesWorked) : 2 à 3 étirements par muscle concerné (voir
// STRETCHES), avec le libellé du muscle. `id` est unique par étirement
// (pas par muscle, plusieurs étirements peuvent partager le même muscle) —
// c'est la clé React et l'identifiant RoutineRunner.
export function getStretchSuggestions(muscleIds) {
  return muscleIds.flatMap((muscleId) => {
    const stretches = STRETCHES[muscleId]
    if (!stretches) return []
    const muscleLabel = getMuscleLabel(muscleId)
    return stretches.map((stretch, index) => ({
      id: `${muscleId}-${index}`,
      muscleId,
      muscleLabel,
      name: stretch.name,
      holdSeconds: stretch.holdSeconds,
    }))
  })
}
