import { getLastPerformance } from './history.js'
import { getSessionById, updateSession } from './sessions.js'

// Les poids/reps sont toujours écrits via domain/sessions.js#updateSet, en
// direct depuis les écrans (même logique "tout se sauvegarde au fil de la
// saisie" que le reste de l'app). Les fonctions ci-dessous ne gèrent que la
// progression dans la séance (phase, exercice/série courants).

export function reorderSessionEntries(sessions, sessionId, fromIndex, toIndex) {
  const session = getSessionById(sessions, sessionId)
  if (!session) return sessions

  const entries = [...session.entries]
  const [moved] = entries.splice(fromIndex, 1)
  entries.splice(toIndex, 0, moved)

  return updateSession(sessions, sessionId, { entries })
}

// Ajoute un exercice à cette séance uniquement (le template d'origine n'est
// pas modifié). Préremplit avec la dernière performance connue, comme à la
// création de la séance.
export function addExerciseEntryToSession(sessions, sessionId, exercise) {
  const session = getSessionById(sessions, sessionId)
  if (!session) return sessions

  const otherSessions = sessions.filter((s) => s.id !== sessionId)
  const last = getLastPerformance(otherSessions, exercise.id)

  const entry = {
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    sets: last ? last.sets.map((set) => ({ ...set })) : [{ weight: 0, reps: 0 }],
  }

  return updateSession(sessions, sessionId, { entries: [...session.entries, entry] })
}

export function removeExerciseEntryFromSession(sessions, sessionId, exerciseId) {
  const session = getSessionById(sessions, sessionId)
  if (!session) return sessions

  const entries = session.entries.filter((e) => e.exerciseId !== exerciseId)
  const changes = { entries }
  if (session.startingExerciseId === exerciseId) {
    changes.startingExerciseId = entries[0]?.exerciseId ?? null
  }

  return updateSession(sessions, sessionId, changes)
}

export function setRestSeconds(sessions, sessionId, restSeconds) {
  return updateSession(sessions, sessionId, { restSeconds })
}

export function setStartingExercise(sessions, sessionId, exerciseId) {
  return updateSession(sessions, sessionId, { startingExerciseId: exerciseId })
}

// Étape 1 -> étape 2 : démarre sur l'exercice choisi.
export function startSession(sessions, sessionId) {
  const session = getSessionById(sessions, sessionId)
  if (!session) return sessions

  const startingExerciseId = session.startingExerciseId ?? session.entries[0]?.exerciseId ?? null

  return updateSession(sessions, sessionId, {
    phase: 'exercise',
    currentExerciseId: startingExerciseId,
    currentSetIndex: 0,
  })
}

// Étape 2 -> étape 3 : démarre le chrono de repos (horodatage absolu de fin,
// voir hooks/useNow.js pour pourquoi). restStartedAt sert à calculer le
// temps de repos RÉEL (pas juste la cible) une fois le repos terminé.
export function validateCurrentSet(sessions, sessionId) {
  const session = getSessionById(sessions, sessionId)
  if (!session) return sessions

  return updateSession(sessions, sessionId, {
    phase: 'resting',
    restUntil: Date.now() + session.restSeconds * 1000,
    restStartedAt: Date.now(),
  })
}

// Étape 3 -> étape 2 (série suivante), étape 4 (exercice suivant) ou fin.
// Enregistre au passage le temps de repos réellement écoulé sur la série
// qui vient d'être faite (peut différer de la cible : repos passé plus tôt,
// ou dépassement).
export function confirmRestReview(sessions, sessionId) {
  const session = getSessionById(sessions, sessionId)
  if (!session) return sessions

  const restTakenSeconds = session.restStartedAt
    ? Math.max(0, Math.round((Date.now() - session.restStartedAt) / 1000))
    : null

  const entries = session.entries.map((entry) =>
    entry.exerciseId === session.currentExerciseId
      ? {
          ...entry,
          sets: entry.sets.map((set, i) => (i === session.currentSetIndex ? { ...set, restTakenSeconds } : set)),
        }
      : entry,
  )

  const currentEntry = entries.find((e) => e.exerciseId === session.currentExerciseId)
  const nextSetIndex = session.currentSetIndex + 1
  const exerciseFinished = nextSetIndex >= currentEntry.sets.length

  if (!exerciseFinished) {
    return updateSession(sessions, sessionId, {
      entries,
      phase: 'exercise',
      currentSetIndex: nextSetIndex,
      restUntil: null,
      restStartedAt: null,
    })
  }

  const completedExerciseIds = [...session.completedExerciseIds, session.currentExerciseId]
  const remaining = entries.filter((e) => !completedExerciseIds.includes(e.exerciseId))

  if (remaining.length === 0) {
    return updateSession(sessions, sessionId, {
      entries,
      phase: 'finished',
      currentExerciseId: null,
      restUntil: null,
      restStartedAt: null,
      completedExerciseIds,
    })
  }

  return updateSession(sessions, sessionId, {
    entries,
    phase: 'picking',
    currentExerciseId: null,
    restUntil: null,
    restStartedAt: null,
    completedExerciseIds,
  })
}

// Termine l'exercice en cours avec seulement les séries déjà validées : la
// série en cours de saisie (jamais validée) est abandonnée plutôt que
// complétée avec des valeurs arbitraires.
export function finishCurrentExerciseEarly(sessions, sessionId) {
  const session = getSessionById(sessions, sessionId)
  if (!session) return sessions

  const entries = session.entries.map((entry) =>
    entry.exerciseId === session.currentExerciseId
      ? { ...entry, sets: entry.sets.slice(0, session.currentSetIndex) }
      : entry,
  )

  const completedExerciseIds = [...session.completedExerciseIds, session.currentExerciseId]
  const remaining = entries.filter((e) => !completedExerciseIds.includes(e.exerciseId))

  const base = {
    entries,
    currentExerciseId: null,
    currentSetIndex: 0,
    restUntil: null,
    restStartedAt: null,
    completedExerciseIds,
  }

  return updateSession(sessions, sessionId, {
    ...base,
    phase: remaining.length === 0 ? 'finished' : 'picking',
  })
}

// Étape 4 -> étape 2 : reprend sur l'exercice choisi.
export function pickNextExercise(sessions, sessionId, exerciseId) {
  return updateSession(sessions, sessionId, {
    phase: 'exercise',
    currentExerciseId: exerciseId,
    currentSetIndex: 0,
  })
}

// Étape 4 -> fin, sans exiger que tout soit complété (getSessionStatus dans
// domain/sessions.js déduira 'partial' si des exercices restent non faits).
export function finishSessionEarly(sessions, sessionId) {
  return updateSession(sessions, sessionId, {
    phase: 'finished',
    currentExerciseId: null,
    restUntil: null,
  })
}
