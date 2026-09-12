import { getLastPerformance } from './history.js'
import { getExerciseUnit } from './muscleGroups.js'

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

// Charge max pour un exercice classique, durée max tenue (secondes, stockées
// dans "reps") pour un exercice "au temps" — voir domain/muscleGroups.js#getExerciseUnit.
function getMaxMetric(sets, unit) {
  return sets.reduce((max, set) => Math.max(max, unit === 'time' ? set.reps : set.weight), 0)
}

// Équivalent du "volume" (poids × reps) pour un exercice au temps : la durée
// totale tenue sur la série, plutôt qu'une charge qui n'a pas de sens ici.
function getMetricVolume(sets, unit) {
  return sets.reduce((total, set) => total + (unit === 'time' ? set.reps : set.weight * set.reps), 0)
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

// Même code couleur up/neutral/down que getExerciseTrend, appliqué à un
// écart numérique plutôt qu'à un exercice.
export function getTrendFromDiff(diff) {
  if (diff == null || diff === 0) return 'neutral'
  return diff > 0 ? 'up' : 'down'
}

// 'up' si la charge (ou la durée, pour un exercice au temps) max OU le
// volume de CET exercice a progressé par rapport à la fois précédente,
// 'down' si l'un des deux a reculé (et aucun n'a progressé), 'neutral'
// sinon (identique ou pas de comparaison).
export function getExerciseTrend(previousEntry, currentEntry, unit = 'reps') {
  if (!previousEntry) return 'neutral'

  const currentMax = getMaxMetric(currentEntry.sets, unit)
  const previousMax = getMaxMetric(previousEntry.sets, unit)
  const currentVolume = getMetricVolume(currentEntry.sets, unit)
  const previousVolume = getMetricVolume(previousEntry.sets, unit)

  if (currentMax > previousMax || currentVolume > previousVolume) return 'up'
  if (currentMax < previousMax || currentVolume < previousVolume) return 'down'
  return 'neutral'
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

// Durée, nombre de séries et de répétitions totales des exercices complétés
// d'une séance. Séances créées avant l'ajout de startedAt/finishedAt : durée
// non disponible (null) plutôt qu'une estimation fausse.
export function getSessionStats(session) {
  const completedIds = session.completedExerciseIds ?? session.entries.map((e) => e.exerciseId)
  const completedEntries = session.entries.filter((e) => completedIds.includes(e.exerciseId))
  const allSets = completedEntries.flatMap((e) => e.sets)

  return {
    durationMs: session.startedAt && session.finishedAt ? session.finishedAt - session.startedAt : null,
    totalSets: allSets.length,
    totalReps: allSets.reduce((total, set) => total + set.reps, 0),
  }
}

// Un item par exercice effectivement complété dans la séance, avec la
// progression par rapport à la DERNIÈRE FOIS que CET EXERCICE a été fait
// (tous templates confondus, via getLastPerformance) — pas seulement la
// dernière fois avec ce même template : un exercice partagé entre plusieurs
// séances types doit se comparer à sa propre dernière occurrence. Le ou les
// exercices à la plus forte progression (%) sont marqués bestProgress pour
// être mis en avant à l'affichage. progressKg est en kg pour un exercice
// classique, en secondes pour un exercice "au temps" (voir progressUnit).
export function buildSessionSummary(sessions, session) {
  const otherSessions = sessions.filter((s) => s.id !== session.id)
  const completedIds = session.completedExerciseIds ?? []

  const items = session.entries
    .filter((entry) => completedIds.includes(entry.exerciseId))
    .map((entry) => {
      const unit = getExerciseUnit(entry.exerciseName)
      const last = getLastPerformance(otherSessions, entry.exerciseId)
      const currentMax = getMaxMetric(entry.sets, unit)
      const previousMax = last ? getMaxMetric(last.sets, unit) : null

      // Arrondi à 2 décimales (pas de figure au-delà en musculation, voir
      // components/StepperField.jsx) pour effacer l'imprécision binaire des
      // nombres flottants (ex : 62.5 - 65.6 = -3.099999999999943 en JS) avant
      // tout affichage ou calcul dérivé (progressPercent doit refléter le
      // même écart que celui affiché).
      const rawProgressKg = previousMax !== null ? currentMax - previousMax : null
      const progressKg = rawProgressKg !== null ? Math.round(rawProgressKg * 100) / 100 : null
      const progressPercent =
        progressKg !== null && previousMax > 0 ? Math.round((progressKg / previousMax) * 100) : null

      return {
        exerciseId: entry.exerciseId,
        exerciseName: entry.exerciseName,
        sets: entry.sets,
        feeling: entry.feeling ?? null,
        progressKg,
        progressUnit: unit === 'time' ? 's' : 'kg',
        progressPercent,
        trend: getExerciseTrend(last ? { sets: last.sets } : null, entry, unit),
      }
    })

  const bestPercent = Math.max(0, ...items.map((item) => item.progressPercent ?? -Infinity))
  return items.map((item) => ({ ...item, bestProgress: bestPercent > 0 && item.progressPercent === bestPercent }))
}
