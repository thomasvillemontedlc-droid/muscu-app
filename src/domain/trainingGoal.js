// Objectif de séance, purement indicatif : il n'empêche jamais de saisir ce
// qu'on veut, il ajuste seulement les répétitions par défaut PROPOSÉES pour
// les exercices qui n'ont encore aucun historique réel dans cette séance
// (voir domain/sessionRunner.js#applyGoalToEntriesWithoutHistory) - un
// exercice déjà fait avant garde toujours sa dernière vraie performance,
// jamais écrasée par ce réglage.
export const TRAINING_GOALS = [
  { value: 'force', label: 'Force (séries courtes et lourdes)' },
  { value: 'endurance', label: 'Endurance (séries longues et légères)' },
]

// Valeur unique proposée par défaut, au milieu de la plage visée (force :
// 4-6 reps, endurance : 15-20 reps) - une vraie plage n'aurait pas de sens
// pour préremplir un seul champ "Répétitions".
const GOAL_DEFAULT_REPS = { force: 5, endurance: 17 }

export function getGoalDefaultReps(goal) {
  return GOAL_DEFAULT_REPS[goal] ?? null
}
