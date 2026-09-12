import { getExerciseMuscles, getMuscleLabel, MUSCLE_GROUPS } from './muscleGroups.js'

// Muscles ciblés en PRINCIPAL par les exercices prévus d'une séance,
// dédupliqués, dans l'ordre standard MUSCLE_GROUPS. Contrairement à
// domain/stretches.js#getPrimaryMusclesWorked, ne filtre pas sur les
// exercices complétés : utilisé avant la séance, quand rien n'a encore été
// fait.
export function getPlannedMusclesWorked(session) {
  const worked = new Set()
  for (const entry of session.entries) {
    for (const muscleId of getExerciseMuscles(entry.exerciseName).primary) worked.add(muscleId)
  }
  return MUSCLE_GROUPS.filter((id) => worked.has(id))
}

// Mouvement d'échauffement générique par groupe musculaire : gestes simples
// sans matériel, pensés comme mise en train avant la séance plutôt que
// comme un échauffement personnalisé (voir la mention affichée avec la
// liste).
const WARMUP_MOVES = {
  pectoraux: 'Rotations des bras, grands cercles',
  dorsaux: 'Rotations des bras et tirage élastique léger',
  trapezes: "Haussements d'épaules",
  deltoides: 'Rotations des épaules',
  biceps: 'Rotations des poignets et des coudes',
  triceps: 'Extensions légères des bras au-dessus de la tête',
  'avant-bras': 'Rotations des poignets',
  brachial: 'Flexions légères des coudes',
  abdominaux: 'Rotations du buste',
  obliques: 'Rotations du buste',
  lombaires: 'Chat-vache (mobilité du dos)',
  quadriceps: 'Squats à vide',
  'ischio-jambiers': 'Fentes avant à vide',
  fessiers: 'Squats à vide',
  mollets: 'Montées sur pointes de pieds',
  adducteurs: 'Cercles de hanches',
  abducteurs: 'Cercles de hanches',
}

const DEFAULT_WARMUP_MOVE = 'Jumping jacks ou marche sur place'
const DEFAULT_WARMUP_SECONDS = 30

// Suggestions d'échauffement pour une liste de muscles (sortie de
// getPlannedMusclesWorked) : un mouvement par muscle concerné, sans doublon
// de mouvement, plus un mouvement général si aucun muscle n'est identifié.
export function getWarmupSuggestions(muscleIds) {
  const seen = new Set()
  const moves = []

  for (const muscleId of muscleIds) {
    const name = WARMUP_MOVES[muscleId] ?? DEFAULT_WARMUP_MOVE
    if (seen.has(name)) continue
    seen.add(name)
    moves.push({ id: muscleId, muscleLabel: getMuscleLabel(muscleId), name, durationSeconds: DEFAULT_WARMUP_SECONDS })
  }

  if (moves.length === 0) {
    moves.push({ id: 'general', muscleLabel: null, name: DEFAULT_WARMUP_MOVE, durationSeconds: DEFAULT_WARMUP_SECONDS })
  }

  return moves
}
