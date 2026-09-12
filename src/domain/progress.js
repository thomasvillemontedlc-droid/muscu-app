import { getExerciseUnit } from './muscleGroups.js'
import { getSessionStatus } from './sessions.js'

// Jours en arrière pour chaque option de période "glissante" de l'onglet
// Progression. "week" (lundi en cours) et "all" (aucune limite) sont gérés
// à part dans getPeriodCutoff, ce ne sont pas des fenêtres glissantes.
const ROLLING_PERIOD_DAYS = {
  '4w': 28,
  '3m': 90,
}

// Date de début (incluse) de la période, ou null pour "tout".
function getPeriodCutoff(periodKey) {
  if (periodKey === 'week') return getWeekStart(new Date())
  const days = ROLLING_PERIOD_DAYS[periodKey]
  if (days == null) return null
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  return cutoff
}

export function getSessionsInPeriod(sessions, periodKey) {
  const cutoff = getPeriodCutoff(periodKey)
  if (cutoff == null) return sessions
  return sessions.filter((s) => new Date(s.date) >= cutoff)
}

// Séances au moins entamées (statut 'done' ou 'partial') sur la période,
// avec le nombre total et le temps d'entraînement cumulé.
export function getPeriodStats(sessionsInPeriod) {
  const started = sessionsInPeriod.filter((s) => getSessionStatus(s) !== 'not-done')
  const totalDurationMs = started.reduce((total, s) => {
    if (!s.startedAt || !s.finishedAt) return total
    return total + (s.finishedAt - s.startedAt)
  }, 0)
  return { count: started.length, totalDurationMs }
}

// Lundi (00:00 local) de la semaine contenant cette date.
function getWeekStart(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + mondayOffset)
  return d
}

// Semaines (lundi à lundi) de la plus ancienne concernée par la période à la
// semaine en cours, une entrée même pour les semaines sans donnée (`value`
// vaut alors undefined) : partagé par getSessionsPerWeek et
// getWeeklyBestLoad pour que leurs graphiques s'alignent sur le même axe.
function buildWeeklySeries(periodKey, valuesByWeekKey) {
  const currentWeekStart = getWeekStart(new Date())
  const cutoff = getPeriodCutoff(periodKey)
  const firstWeekStart =
    cutoff != null
      ? getWeekStart(cutoff)
      : valuesByWeekKey.size > 0
        ? new Date(Math.min(...valuesByWeekKey.keys()))
        : currentWeekStart

  const weeks = []
  for (let t = firstWeekStart.getTime(); t <= currentWeekStart.getTime(); t += 7 * 24 * 3600 * 1000) {
    weeks.push({ weekStart: new Date(t), value: valuesByWeekKey.get(t) })
  }
  return weeks
}

// Nombre de séances au moins entamées par semaine sur la période, une
// entrée par semaine même à 0 (pour un graphique sans trou), de la semaine
// la plus ancienne concernée jusqu'à la semaine en cours.
export function getSessionsPerWeek(sessions, periodKey) {
  const scoped = getSessionsInPeriod(sessions, periodKey).filter((s) => getSessionStatus(s) !== 'not-done')

  const counts = new Map()
  for (const session of scoped) {
    const key = getWeekStart(session.date).getTime()
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  return buildWeeklySeries(periodKey, counts).map(({ weekStart, value }) => ({ weekStart, count: value ?? 0 }))
}

// {id, name} de chaque exercice effectivement complété au moins une fois
// sur la période, triés par nom.
export function getCompletedExercisesInPeriod(sessions, periodKey) {
  const scoped = getSessionsInPeriod(sessions, periodKey)
  const names = new Map()

  for (const session of scoped) {
    const completedIds = session.completedExerciseIds ?? []
    for (const entry of session.entries) {
      if (completedIds.includes(entry.exerciseId) && !names.has(entry.exerciseId)) {
        names.set(entry.exerciseId, entry.exerciseName)
      }
    }
  }

  return [...names.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name))
}

function getSetMetric(set, unit) {
  return unit === 'time' ? set.reps : set.weight
}

function getBestSet(sets, unit) {
  return sets.reduce((best, set) => (!best || getSetMetric(set, unit) > getSetMetric(best, unit) ? set : best), null)
}

// La meilleure série de chaque séance où cet exercice a été complété sur la
// période (charge max, ou durée max pour un exercice "au temps"), du plus
// récent au plus ancien.
export function getBestSetHistory(sessions, exerciseId, periodKey) {
  const scoped = getSessionsInPeriod(sessions, periodKey)
  const rows = []

  for (const session of scoped) {
    const completedIds = session.completedExerciseIds ?? []
    if (!completedIds.includes(exerciseId)) continue

    const entry = session.entries.find((e) => e.exerciseId === exerciseId)
    if (!entry) continue

    const unit = getExerciseUnit(entry.exerciseName)
    const best = getBestSet(entry.sets, unit)
    if (!best) continue

    rows.push({ date: session.date, weight: best.weight, reps: best.reps, unit })
  }

  return rows.sort((a, b) => b.date.localeCompare(a.date))
}

// Meilleure charge (ou durée, pour un exercice "au temps") par semaine sur
// la période, pour le graphique d'évolution sous le sélecteur d'exercice de
// l'onglet Progression : une entrée par semaine, `value` à undefined si
// aucune séance cette semaine-là (trou dans le graphique plutôt qu'une
// chute trompeuse à zéro).
export function getWeeklyBestLoad(sessions, exerciseId, periodKey) {
  const rows = getBestSetHistory(sessions, exerciseId, periodKey)
  const unit = rows[0]?.unit ?? 'weight'
  const bestByWeek = new Map()

  for (const row of rows) {
    const key = getWeekStart(row.date).getTime()
    const value = row.unit === 'time' ? row.reps : row.weight
    const current = bestByWeek.get(key)
    if (current == null || value > current) bestByWeek.set(key, value)
  }

  return { unit, weeks: buildWeeklySeries(periodKey, bestByWeek) }
}
