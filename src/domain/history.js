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

// Exercices déjà utilisés dans des séances passées portant le même nom de
// template, du plus récemment utilisé au moins récent. Sert à faire
// remonter les suggestions les plus pertinentes en premier (fonctionnalité
// "ajouter un exercice" pendant la préparation d'une séance).
export function getExercisesUsedInTemplate(sessions, templateName) {
  const sorted = [...sessions]
    .filter((s) => s.templateName === templateName)
    .sort((a, b) => b.date.localeCompare(a.date))

  const seen = new Set()
  const ordered = []

  for (const session of sorted) {
    for (const entry of session.entries) {
      if (!seen.has(entry.exerciseId)) {
        seen.add(entry.exerciseId)
        ordered.push(entry.exerciseId)
      }
    }
  }

  return ordered
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
