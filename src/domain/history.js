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

// Séances passées groupées par jour calendaire, du plus récent au plus
// ancien, avec pour chaque jour la ou les séances faites ce jour-là
// (fonctionnalité 5).
export function getSessionsGroupedByDate(sessions) {
  const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date))
  const groups = []
  let currentDay = null

  for (const session of sorted) {
    const day = session.date.slice(0, 10) // YYYY-MM-DD
    if (day !== currentDay) {
      currentDay = day
      groups.push({ day, sessions: [] })
    }
    groups[groups.length - 1].sessions.push(session)
  }

  return groups
}
