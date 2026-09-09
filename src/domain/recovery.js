import { getExerciseMuscles, getMuscleLabel, MUSCLE_GROUPS } from './muscleGroups.js'

// Seuils de récupération, modifiables ici. En dessous de RECOVERY_HOURS, le
// muscle est considéré encore en cours de récupération ; au-delà de
// NEGLECTED_DAYS sans sollicitation, il est considéré négligé.
export const RECOVERY_HOURS = 48
export const NEGLECTED_DAYS = 10

function getCompletedEntries(session) {
  const completedIds = session.completedExerciseIds ?? session.entries.map((e) => e.exerciseId)
  return session.entries.filter((e) => completedIds.includes(e.exerciseId))
}

// Muscles sollicités (principal ou secondaire) par une entrée, seulement si
// au moins une série a réellement été faite.
function getEntryMuscles(entry) {
  const hasVolume = entry.sets.some((set) => set.weight * set.reps > 0)
  if (!hasVolume) return []
  const { primary, secondary } = getExerciseMuscles(entry.exerciseName)
  return [...primary, ...secondary]
}

// Date de dernière sollicitation de chaque muscle, tous muscles confondus,
// en un seul passage sur les séances (triées une fois, la plus récente
// gagne pour chaque muscle rencontré).
function getLastWorkedDates(sessions) {
  const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date))
  const lastWorked = {}

  for (const session of sorted) {
    for (const entry of getCompletedEntries(session)) {
      for (const muscleId of getEntryMuscles(entry)) {
        if (!(muscleId in lastWorked)) lastWorked[muscleId] = session.date
      }
    }
  }

  return lastWorked
}

// 'recovering'  : sollicité récemment, encore sous le seuil de récupération
// 'recovered'   : récupéré, prêt à retravailler ce muscle
// 'neglected'   : plus sollicité depuis trop longtemps
// 'never'       : jamais sollicité dans les séances enregistrées
function getStatus(hoursSince) {
  if (hoursSince == null) return 'never'
  if (hoursSince < RECOVERY_HOURS) return 'recovering'
  if (hoursSince > NEGLECTED_DAYS * 24) return 'neglected'
  return 'recovered'
}

// Liste des 14 muscles avec, pour chacun, la date de dernière sollicitation,
// le nombre de jours écoulés (arrondi à l'entier inférieur, null si jamais)
// et le statut de récupération dérivé. Ordre fixe (MUSCLE_GROUPS).
export function getMuscleRecovery(sessions, now = new Date()) {
  const lastWorked = getLastWorkedDates(sessions)

  return MUSCLE_GROUPS.map((muscleId) => {
    const lastDate = lastWorked[muscleId] ?? null
    const hoursSince = lastDate ? (now.getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60) : null
    const daysSince = hoursSince != null ? Math.floor(hoursSince / 24) : null

    return {
      muscleId,
      label: getMuscleLabel(muscleId),
      lastDate,
      daysSince,
      status: getStatus(hoursSince),
    }
  })
}

// Même liste, triée du muscle le plus négligé au plus récemment sollicité
// (jamais sollicité en tête). Sert à l'écran "muscles négligés".
export function getMostNeglectedMuscles(sessions, now = new Date()) {
  return [...getMuscleRecovery(sessions, now)].sort((a, b) => {
    if (a.daysSince == null && b.daysSince == null) return 0
    if (a.daysSince == null) return -1
    if (b.daysSince == null) return 1
    return b.daysSince - a.daysSince
  })
}
