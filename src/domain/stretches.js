import { getExerciseMuscles, getMuscleLabel, MUSCLE_GROUPS } from './muscleGroups.js'

// Étirement générique par groupe musculaire, avec un temps de maintien
// indicatif. Volontairement simple : ce ne sont que des suggestions
// générales (voir la mention affichée avec la liste dans FinishedView).
const STRETCHES = {
  pectoraux: { name: 'Étirement pectoraux en appui contre un mur, bras tendu', holdSeconds: 30 },
  dorsaux: { name: 'Bras tendus devant soi, dos rond, en tirant les mains vers l’avant', holdSeconds: 30 },
  trapezes: { name: 'Inclinaison latérale de la tête, main opposée sur l’oreille', holdSeconds: 20 },
  deltoides: { name: 'Bras tendu devant la poitrine, tiré avec l’autre bras', holdSeconds: 20 },
  biceps: { name: 'Bras tendu derrière soi, paume vers l’arrière, contre un mur', holdSeconds: 20 },
  triceps: { name: 'Bras plié derrière la tête, coude tiré vers le bas par l’autre main', holdSeconds: 20 },
  'avant-bras': { name: 'Bras tendu devant soi, poignet fléchi, tiré avec l’autre main', holdSeconds: 20 },
  brachial: { name: 'Bras tendu, paume vers le bas, poignet fléchi vers le sol', holdSeconds: 20 },
  abdominaux: { name: 'Allongé sur le ventre, buste relevé en appui sur les avant-bras', holdSeconds: 30 },
  obliques: { name: 'Debout, bras levé, buste incliné sur le côté', holdSeconds: 20 },
  lombaires: { name: 'Genoux au buste, allongé sur le dos', holdSeconds: 30 },
  quadriceps: { name: 'Debout, talon vers la fesse, genou tiré vers l’arrière', holdSeconds: 30 },
  'ischio-jambiers': { name: 'Jambe tendue posée devant, buste penché en avant', holdSeconds: 30 },
  fessiers: { name: 'Allongé sur le dos, genou ramené vers la poitrine opposée', holdSeconds: 30 },
  mollets: { name: 'Face à un mur, jambe tendue en arrière, talon au sol', holdSeconds: 30 },
  adducteurs: { name: 'Assis, plantes de pieds jointes, genoux poussés vers le sol', holdSeconds: 30 },
  abducteurs: { name: 'Debout, une jambe croisée devant l’autre, buste penché sur le côté', holdSeconds: 30 },
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
// getPrimaryMusclesWorked), avec le libellé du muscle concerné.
export function getStretchSuggestions(muscleIds) {
  return muscleIds
    .filter((id) => STRETCHES[id])
    .map((id) => ({ muscleId: id, muscleLabel: getMuscleLabel(id), ...STRETCHES[id] }))
}
