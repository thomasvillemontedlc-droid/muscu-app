// Dernière performance enregistrée sur un exercice donné, tous templates confondus.
// Sert à pré-remplir les champs quand on relance une séance (fonctionnalité 3).
export function getLastPerformance(sessions, exerciseId) {
  const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date))

  for (const session of sorted) {
    const entry = session.entries.find((e) => e.exerciseId === exerciseId)
    if (entry && entry.sets.length > 0) {
      return { date: session.date, sets: entry.sets }
    }
  }

  return null
}

// Historique complet d'un exercice, du plus récent au plus ancien (fonctionnalité 5).
export function getExerciseHistory(sessions, exerciseId) {
  return [...sessions]
    .filter((s) => s.entries.some((e) => e.exerciseId === exerciseId))
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((s) => {
      const entry = s.entries.find((e) => e.exerciseId === exerciseId)
      return { sessionId: s.id, date: s.date, done: s.done, sets: entry.sets }
    })
}
