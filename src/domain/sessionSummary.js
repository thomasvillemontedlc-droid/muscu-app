// Séance précédente avec le même nom de template, pour comparer la
// progression (fonctionnalité "récap de fin de séance").
export function getPreviousSessionByTemplate(sessions, currentSession) {
  return (
    [...sessions]
      .filter((s) => s.id !== currentSession.id)
      .filter((s) => s.templateName === currentSession.templateName)
      .filter((s) => s.date < currentSession.date)
      .sort((a, b) => b.date.localeCompare(a.date))[0] ?? null
  )
}

function getMaxWeight(sets) {
  return sets.reduce((max, set) => Math.max(max, set.weight), 0)
}

// Séances créées avant le suivi de complétion (completedExerciseIds absent)
// : on suppose que tout était prévu comme fait, pour ne pas déclencher de
// fausse "progression" par rapport à une séance simplement plus ancienne.
function getCompletedCounts(session) {
  const completedIds = session.completedExerciseIds ?? session.entries.map((e) => e.exerciseId)
  const completedEntries = session.entries.filter((e) => completedIds.includes(e.exerciseId))
  return {
    exercises: completedEntries.length,
    sets: completedEntries.reduce((total, e) => total + e.sets.length, 0),
  }
}

// Progression au niveau de la séance entière (pas un exercice précis) :
// plus d'exercices ou de séries complétés que la dernière fois avec ce même
// template, indépendamment des charges. Distinct du message par exercice.
export function getCompletionProgress(sessions, session) {
  const previous = getPreviousSessionByTemplate(sessions, session)
  if (!previous) return null

  const current = getCompletedCounts(session)
  const before = getCompletedCounts(previous)

  if (current.exercises > before.exercises) {
    return {
      message:
        current.exercises >= session.entries.length
          ? `Bravo, tu as complété toute la séance cette fois-ci (contre ${before.exercises}/${previous.entries.length} exercices la dernière fois) !`
          : `Bravo, tu as fait plus d'exercices que la dernière fois (${current.exercises} contre ${before.exercises}) !`,
    }
  }

  if (current.exercises === before.exercises && current.sets > before.sets) {
    return { message: `Bravo, tu as fait plus de séries que la dernière fois (${current.sets} contre ${before.sets}) !` }
  }

  return null
}

// Un item par exercice effectivement complété dans la séance, avec un
// message de progression (poids max de la série) uniquement si la charge a
// augmenté par rapport à la dernière fois où ce template a été fait.
export function buildSessionSummary(sessions, session) {
  const previous = getPreviousSessionByTemplate(sessions, session)
  const completedIds = session.completedExerciseIds ?? []

  return session.entries
    .filter((entry) => completedIds.includes(entry.exerciseId))
    .map((entry) => {
      const previousEntry = previous?.entries.find((e) => e.exerciseId === entry.exerciseId)
      const currentMax = getMaxWeight(entry.sets)
      const previousMax = previousEntry ? getMaxWeight(previousEntry.sets) : null

      const progressKg = previousMax !== null && currentMax > previousMax ? currentMax - previousMax : null
      const progressPercent =
        progressKg !== null && previousMax > 0 ? Math.round((progressKg / previousMax) * 100) : null

      return {
        exerciseId: entry.exerciseId,
        exerciseName: entry.exerciseName,
        sets: entry.sets,
        progressKg,
        progressPercent,
      }
    })
}
