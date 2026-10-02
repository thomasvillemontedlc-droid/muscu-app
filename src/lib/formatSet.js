import { getExerciseUnit } from '../domain/muscleGroups.js'

function sideSuffix(set) {
  return set.side ? ` (${set.side === 'droit' ? 'D' : 'G'})` : ''
}

// Une série d'exercice "au temps" (gainage, planche...) stocke sa durée
// dans le champ "reps" (en secondes) plutôt que d'introduire un champ
// séparé : toute la mécanique existante (dernière perf, progression,
// historique) continue de fonctionner sans changement de schéma.
export function formatSet(set, exerciseName) {
  if (getExerciseUnit(exerciseName) === 'time') {
    return (set.weight > 0 ? `${set.weight}kg, ${set.reps}s` : `${set.reps}s`) + sideSuffix(set)
  }
  return `${set.weight}kg×${set.reps}${sideSuffix(set)}`
}

// Position affichée d'une série dans sa liste : son propre index+1 d'habitude,
// ou le numéro de PAIRE + le côté pour un exercice unilatéral (voir
// domain/exercises.js#setExerciseUnilateral) - droit+gauche consécutifs
// comptent comme UNE série aux yeux de l'utilisateur.
export function getSetPosition(sets, index) {
  const set = sets[index]
  if (!set || set.side == null) return { position: index + 1, total: sets.length, sideLabel: null }

  return {
    position: Math.floor(index / 2) + 1,
    total: Math.ceil(sets.length / 2),
    sideLabel: set.side === 'droit' ? 'Côté droit' : 'Côté gauche',
  }
}
