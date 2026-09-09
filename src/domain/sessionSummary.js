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

function getVolume(sets) {
  return sets.reduce((total, set) => total + set.weight * set.reps, 0)
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

// Volume total (poids × reps, toutes séries) des exercices complétés d'une
// séance. Ignore les exercices jamais commencés : leurs séries ne sont que
// le pré-remplissage de la dernière fois, pas du travail réellement fait.
export function getSessionVolume(session) {
  const completedIds = session.completedExerciseIds ?? session.entries.map((e) => e.exerciseId)
  return session.entries
    .filter((e) => completedIds.includes(e.exerciseId))
    .reduce((total, e) => total + getVolume(e.sets), 0)
}

// Même code couleur up/neutral/down que getExerciseTrend, appliqué à un
// écart numérique (volume total de séance) plutôt qu'à un exercice.
export function getTrendFromDiff(diff) {
  if (diff == null || diff === 0) return 'neutral'
  return diff > 0 ? 'up' : 'down'
}

// Comparaison du volume total avec la séance précédente du même template.
export function getVolumeProgress(sessions, session) {
  const volume = getSessionVolume(session)
  const previous = getPreviousSessionByTemplate(sessions, session)
  if (!previous) return { volume, previousVolume: null, diff: null, percent: null }

  const previousVolume = getSessionVolume(previous)
  const diff = volume - previousVolume
  const percent = previousVolume > 0 ? Math.round((diff / previousVolume) * 100) : null

  return { volume, previousVolume, diff, percent }
}

// 'up' si la charge max OU le volume de CET exercice a progressé par
// rapport à la fois précédente, 'down' si l'un des deux a reculé (et
// aucun n'a progressé), 'neutral' sinon (identique ou pas de comparaison).
export function getExerciseTrend(previousEntry, currentEntry) {
  if (!previousEntry) return 'neutral'

  const currentMax = getMaxWeight(currentEntry.sets)
  const previousMax = getMaxWeight(previousEntry.sets)
  const currentVolume = getVolume(currentEntry.sets)
  const previousVolume = getVolume(previousEntry.sets)

  if (currentMax > previousMax || currentVolume > previousVolume) return 'up'
  if (currentMax < previousMax || currentVolume < previousVolume) return 'down'
  return 'neutral'
}

// Tendance par exercice pour une séance entière (tous les exercices de
// session.entries, pas seulement ceux complétés) — sert à l'Historique, où
// chaque séance passée affiche tous ses exercices tels quels.
export function getEntryTrends(sessions, session) {
  const previous = getPreviousSessionByTemplate(sessions, session)
  const trends = {}
  for (const entry of session.entries) {
    const previousEntry = previous?.entries.find((e) => e.exerciseId === entry.exerciseId)
    trends[entry.exerciseId] = getExerciseTrend(previousEntry, entry)
  }
  return trends
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
// d'une séance, en plus du volume déjà calculé par getSessionVolume.
// Séances créées avant l'ajout de startedAt/finishedAt : durée non
// disponible (null) plutôt qu'une estimation fausse.
export function getSessionStats(session) {
  const completedIds = session.completedExerciseIds ?? session.entries.map((e) => e.exerciseId)
  const completedEntries = session.entries.filter((e) => completedIds.includes(e.exerciseId))
  const allSets = completedEntries.flatMap((e) => e.sets)

  return {
    durationMs: session.startedAt && session.finishedAt ? session.finishedAt - session.startedAt : null,
    totalSets: allSets.length,
    totalReps: allSets.reduce((total, set) => total + set.reps, 0),
    totalVolume: getSessionVolume(session),
  }
}

// Un item par exercice effectivement complété dans la séance, avec un
// message de progression (poids max de la série) uniquement si la charge a
// augmenté par rapport à la dernière fois où ce template a été fait, et une
// tendance (vert/neutre/orange) basée sur charge OU volume.
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
        trend: getExerciseTrend(previousEntry, entry),
      }
    })
}
