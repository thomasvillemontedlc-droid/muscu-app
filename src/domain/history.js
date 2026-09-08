import { getSessionStatus } from './sessions.js'

// "YYYY-MM-DD" en jour CALENDAIRE LOCAL de l'utilisateur, pas la date UTC
// que renverrait toISOString()/slice(0,10) sur une date-heure — sinon une
// séance faite tard le soir peut se retrouver rangée sous le jour suivant
// (ou précédent, selon le fuseau) au lieu du jour réellement vécu.
function toLocalDayKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

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

// Les 7 jours de la semaine en cours (lundi -> dimanche) avec le meilleur
// statut de séance ce jour-là ('done' > 'partial' > 'none'), pour l'encart
// de suivi hebdomadaire.
export function getWeekActivity(sessions, referenceDate = new Date()) {
  const dayOfWeek = referenceDate.getDay() // 0 = dimanche
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(referenceDate)
  monday.setHours(0, 0, 0, 0)
  monday.setDate(monday.getDate() + mondayOffset)

  const days = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)
    const dayKey = toLocalDayKey(date)

    const sessionsThatDay = sessions.filter((s) => toLocalDayKey(new Date(s.date)) === dayKey)
    const statuses = sessionsThatDay.map(getSessionStatus)

    let status = 'none'
    if (statuses.includes('done')) status = 'done'
    else if (statuses.includes('partial')) status = 'partial'

    days.push({ date, status })
  }

  return days
}

// Séances passées groupées par jour calendaire, du plus récent au plus
// ancien, avec pour chaque jour la ou les séances faites ce jour-là
// (fonctionnalité 5).
export function getSessionsGroupedByDate(sessions) {
  const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date))
  const groups = []
  let currentDay = null

  for (const session of sorted) {
    const day = toLocalDayKey(new Date(session.date))
    if (day !== currentDay) {
      currentDay = day
      groups.push({ day, sessions: [] })
    }
    groups[groups.length - 1].sessions.push(session)
  }

  return groups
}
