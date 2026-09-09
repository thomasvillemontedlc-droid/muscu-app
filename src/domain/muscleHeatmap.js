import { getExerciseMuscles, MUSCLE_GROUPS } from './muscleGroups.js'

// Muscle secondaire compté à moitié : sollicité, mais moins que le muscle
// principal de l'exercice.
const SECONDARY_WEIGHT = 0.5

function getSetsVolume(sets) {
  return sets.reduce((total, set) => total + set.weight * set.reps, 0)
}

function addEntryVolume(volumes, entry) {
  const volume = getSetsVolume(entry.sets)
  if (volume === 0) return volumes

  const { primary, secondary } = getExerciseMuscles(entry.exerciseName)
  for (const muscleId of primary) volumes[muscleId] = (volumes[muscleId] ?? 0) + volume
  for (const muscleId of secondary) volumes[muscleId] = (volumes[muscleId] ?? 0) + volume * SECONDARY_WEIGHT

  return volumes
}

// Entrées effectivement complétées d'une séance (mêmes règles que
// getSessionVolume dans sessionSummary.js : les exercices jamais commencés
// ne comptent pas, ce ne sont que des séries pré-remplies non faites).
function getCompletedEntries(session) {
  const completedIds = session.completedExerciseIds ?? session.entries.map((e) => e.exerciseId)
  return session.entries.filter((e) => completedIds.includes(e.exerciseId))
}

// Volume par muscle (kg) pour une séance unique.
export function getMuscleVolumes(session) {
  return getCompletedEntries(session).reduce(addEntryVolume, {})
}

// Volume par muscle cumulé sur plusieurs séances (ex. 7 ou 30 derniers jours).
export function getCumulativeMuscleVolumes(sessions) {
  const volumes = {}
  for (const session of sessions) {
    for (const entry of getCompletedEntries(session)) addEntryVolume(volumes, entry)
  }
  return volumes
}

// Convertit des volumes bruts en intensités 0..1, relatives au muscle le
// plus sollicité du lot (pas de progression absolue, une carte de chaleur
// compare la séance/la période à elle-même).
export function getMuscleIntensities(volumes) {
  const max = Math.max(0, ...MUSCLE_GROUPS.map((id) => volumes[id] ?? 0))
  const intensities = {}
  for (const id of MUSCLE_GROUPS) {
    intensities[id] = max > 0 ? (volumes[id] ?? 0) / max : 0
  }
  return intensities
}

// true si au moins un muscle a été sollicité (évite d'afficher une carte de
// chaleur totalement éteinte quand rien n'a pu être associé à un muscle).
export function hasAnyIntensity(intensities) {
  return MUSCLE_GROUPS.some((id) => (intensities[id] ?? 0) > 0)
}
