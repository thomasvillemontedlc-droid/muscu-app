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
// vaut alors undefined), pour le graphique de getSessionsPerWeek.
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

