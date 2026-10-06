import { getExerciseUnit } from '../domain/muscleGroups.js'
import { getWorkSets, isWarmupSet } from '../domain/setKinds.js'
import { formatDecimal } from './formatNumber.js'

function sideSuffix(set) {
  return set.side ? ` (${set.side === 'droit' ? 'D' : 'G'})` : ''
}

function warmupSuffix(set) {
  return isWarmupSet(set) ? ' (échauff.)' : ''
}

// Une série d'exercice "au temps" (gainage, planche...) stocke sa durée
// dans le champ "reps" (en secondes) plutôt que d'introduire un champ
// séparé : toute la mécanique existante (dernière perf, progression,
// historique) continue de fonctionner sans changement de schéma. Les
// répétitions peuvent être des demi-répétitions (7,5), affichées avec une
// virgule.
export function formatSet(set, exerciseName) {
  if (getExerciseUnit(exerciseName) === 'time') {
    return (set.weight > 0 ? `${set.weight}kg, ${set.reps}s` : `${set.reps}s`) + sideSuffix(set) + warmupSuffix(set)
  }
  return `${set.weight}kg×${formatDecimal(set.reps)}${sideSuffix(set)}${warmupSuffix(set)}`
}

// Position affichée d'une série dans sa liste, comptée parmi les séries de
// travail seulement (les échauffements ne sont pas numérotés : warmup=true,
// position null) : son rang d'habitude, ou le numéro de PAIRE + le côté
// pour un exercice unilatéral (voir domain/exercises.js#setExerciseUnilateral)
// - droit+gauche consécutifs comptent comme UNE série aux yeux de
// l'utilisateur.
export function getSetPosition(sets, index) {
  const set = sets[index]
  const workSets = getWorkSets(sets)
  const paired = set?.side != null
  const total = paired ? Math.ceil(workSets.length / 2) : workSets.length
  const sideLabel = paired ? (set.side === 'droit' ? 'Côté droit' : 'Côté gauche') : null

  if (isWarmupSet(set)) return { warmup: true, position: null, total, sideLabel }

  const workIndex = getWorkSets(sets.slice(0, index)).length
  return { warmup: false, position: paired ? Math.floor(workIndex / 2) + 1 : workIndex + 1, total, sideLabel }
}

// Libellé court d'une série dans une liste éditable (voir
// components/SetRow.jsx) : "Échauffement" ou "Série #n", + (D)/(G).
export function getSetLabel(sets, index) {
  const { warmup, position, sideLabel } = getSetPosition(sets, index)
  const side = sideLabel ? ` (${sideLabel === 'Côté droit' ? 'D' : 'G'})` : ''
  return warmup ? `Échauffement${side}` : `Série #${position}${side}`
}
