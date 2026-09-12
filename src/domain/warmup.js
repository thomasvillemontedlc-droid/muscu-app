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

// Alternatives par muscle proposées dans le champ "Ajouter un mouvement" de
// l'échauffement (voir components/RoutineRunner.jsx), en plus du mouvement
// déjà pré-rempli par muscle (WARMUP_MOVES ci-dessus) : de quoi varier sans
// resaisir à la main.
const WARMUP_MOVE_OPTIONS = {
  pectoraux: ['Ouvertures de bras (swings horizontaux)', 'Pompes contre un mur'],
  dorsaux: ['Tirage élastique léger', "Étirement actif 'chat-vache'"],
  trapezes: ['Cercles des épaules', 'Rotations douces de la nuque'],
  deltoides: ['Élévations latérales à vide', 'Cercles de bras'],
  biceps: ['Flexions légères des coudes à vide'],
  triceps: ['Rotations des bras'],
  'avant-bras': ['Étirements des poignets'],
  brachial: ['Rotations des avant-bras'],
  abdominaux: ['Gainage léger (15s)'],
  obliques: ['Flexions latérales du buste'],
  lombaires: ['Rotations du bassin'],
  quadriceps: ['Fentes avant à vide', 'Montées de genoux'],
  'ischio-jambiers': ['Balancements de jambe', 'Squats à vide'],
  fessiers: ['Pont fessier à vide', 'Fentes avant à vide'],
  mollets: ['Sautillements légers'],
  adducteurs: ['Fentes latérales à vide'],
  abducteurs: ['Marche latérale (pas chassés)'],
}

const GENERAL_WARMUP_OPTIONS = [
  DEFAULT_WARMUP_MOVE,
  'Corde à sauter légère',
  'Vélo ou rameur à faible intensité',
]

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

// Noms de mouvements à proposer dans le champ "Ajouter un mouvement" de
// l'échauffement (voir components/RoutineRunner.jsx#suggestions) : les
// alternatives des muscles ciblés par la séance à venir, puis quelques
// options générales, sans doublon.
export function getWarmupMoveSuggestions(muscleIds) {
  const seen = new Set()
  const suggestions = []

  function add(name) {
    if (seen.has(name)) return
    seen.add(name)
    suggestions.push(name)
  }

  for (const muscleId of muscleIds) {
    for (const name of WARMUP_MOVE_OPTIONS[muscleId] ?? []) add(name)
  }
  for (const name of GENERAL_WARMUP_OPTIONS) add(name)

  return suggestions
}
