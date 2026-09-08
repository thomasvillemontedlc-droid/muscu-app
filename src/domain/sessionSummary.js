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
