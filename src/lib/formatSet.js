import { getExerciseUnit } from '../domain/muscleGroups.js'

// Une série d'exercice "au temps" (gainage, planche...) stocke sa durée
// dans le champ "reps" (en secondes) plutôt que d'introduire un champ
// séparé : toute la mécanique existante (dernière perf, progression,
// historique) continue de fonctionner sans changement de schéma.
export function formatSet(set, exerciseName) {
  if (getExerciseUnit(exerciseName) === 'time') {
    return set.weight > 0 ? `${set.weight}kg, ${set.reps}s` : `${set.reps}s`
  }
  return `${set.weight}kg×${set.reps}`
}
