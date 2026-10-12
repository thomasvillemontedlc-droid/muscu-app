import { getExerciseMuscles, getExercisesForMuscle, resolveExerciseCanonicalKey } from './muscleGroups.js'
import { getMostNeglectedMuscles } from './recovery.js'

// Petits muscles d'accessoire, déjà sollicités en secondaire par les
// tirages et les curls : jamais proposés seuls, sinon "jamais travaillé"
// les ferait sortir en tête à chaque séance.
const ACCESSORY_MUSCLES = new Set(['avant-bras', 'brachial'])

// Exercice en cours = dernier exercice non terminé de la séance : c'est le
// moment de proposer d'en ajouter un ("Compléter ta séance", voir
// ExerciseView.jsx).
export function isLastRemainingExercise(session) {
  const remaining = session.entries.filter((e) => !session.completedExerciseIds.includes(e.exerciseId))
  return remaining.length === 1 && remaining[0].exerciseId === session.currentExerciseId
}

// Suggestion d'UN exercice pour compléter la séance : le muscle le plus
// négligé (jamais travaillé d'abord, puis le plus ancien, voir
// domain/recovery.js#getMostNeglectedMuscles), hors muscles sollicités par
// cette séance (principal ou secondaire, exercices prévus compris), hors
// petits muscles d'accessoire (ACCESSORY_MUSCLES) et hors
// muscles encore en récupération (< RECOVERY_HOURS). L'exercice proposé
// est le premier de getExercisesForMuscle, qui fait passer devant ceux
// déjà présents dans les séances types (matériel connu).
// Renvoie {muscleId, label, status, daysSince, exerciseName} ou null si
// aucun muscle ne correspond.
export function suggestExerciseToComplete(session, sessions, templates, exercises, now = new Date()) {
  const sessionMuscles = new Set()
  for (const entry of session.entries) {
    const { primary, secondary } = getExerciseMuscles(entry.exerciseName)
    for (const muscleId of [...primary, ...secondary]) sessionMuscles.add(muscleId)
  }

  const templateExerciseIds = new Set(templates.flatMap((t) => t.exerciseIds))
  const templateExercises = exercises.filter((e) => templateExerciseIds.has(e.id))
  const inSessionNames = new Set(session.entries.map((e) => e.exerciseName))
  const otherSessions = sessions.filter((s) => s.id !== session.id)

  for (const muscle of getMostNeglectedMuscles(otherSessions, now)) {
    if (ACCESSORY_MUSCLES.has(muscle.muscleId)) continue
    if (muscle.status === 'recovering' || sessionMuscles.has(muscle.muscleId)) continue
    const candidate = getExercisesForMuscle(muscle.muscleId, templateExercises, Infinity).find(
      (e) => !inSessionNames.has(e.name),
    )
    if (!candidate) continue
    // Exercice déjà dans une séance type : son nom à lui (ex. "Gainage"),
    // pas le nom canonique du catalogue ("Gainage planche").
    const key = resolveExerciseCanonicalKey(candidate.name)
    const own = templateExercises.find((e) => resolveExerciseCanonicalKey(e.name) === key)
    return {
      muscleId: muscle.muscleId,
      label: muscle.label,
      status: muscle.status,
      daysSince: muscle.daysSince,
      exerciseName: own?.name ?? candidate.name,
    }
  }

  return null
}
