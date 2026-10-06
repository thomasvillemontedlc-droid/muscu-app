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

// Résumé d'une performance pour le bandeau de repos : "4 × 10 à 40 kg" si
// toutes les séries sont identiques, "10, 9, 8 à 40 kg" si seule la charge
// est commune, sinon la liste des séries. Séries de travail seulement ; une
// paire droit/gauche compte pour une série. null s'il n'y a rien.
export function formatPerformanceSummary(sets, exerciseName) {
  const work = getWorkSets(sets)
  if (work.length === 0) return null
  const paired = work.every((set) => set.side != null)
  const series = paired ? work.filter((set) => set.side === 'droit') : work
  const isTime = getExerciseUnit(exerciseName) === 'time'
  const formatReps = (reps) => (isTime ? `${reps} s` : formatDecimal(reps))
  const sameWeight = series.every((set) => set.weight === series[0].weight)
  const sameReps = series.every((set) => set.reps === series[0].reps)
  const weightSuffix = series[0].weight > 0 ? ` à ${formatDecimal(series[0].weight)} kg` : ''

  if (sameWeight && sameReps) return `${series.length} × ${formatReps(series[0].reps)}${weightSuffix}`
  if (sameWeight) return `${series.map((set) => formatReps(set.reps)).join(', ')}${weightSuffix}`
  return series.map((set) => formatSet({ ...set, side: undefined }, exerciseName)).join(', ')
}

// Libellé court d'une série dans une liste éditable (voir
// components/SetRow.jsx) : "Échauffement" ou "Série #n", + (D)/(G).
export function getSetLabel(sets, index) {
  const { warmup, position, sideLabel } = getSetPosition(sets, index)
  const side = sideLabel ? ` (${sideLabel === 'Côté droit' ? 'D' : 'G'})` : ''
  return warmup ? `Échauffement${side}` : `Série #${position}${side}`
}
