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
    startedAt: session.startedAt ?? Date.now(),
  })
}

// Écrit le temps de repos réellement écoulé sur la série qui l'a déclenché
// (pas forcément la série courante : si on a changé d'exercice entre-temps,
// le repos continue de courir et se clôture sur la série d'origine).
function closeOutPendingRest(session, entries) {
  if (!session.restStartedAt || session.pendingRestExerciseId == null) return entries

  const restTakenSeconds = Math.max(0, Math.round((Date.now() - session.restStartedAt) / 1000))

  return entries.map((entry) =>
    entry.exerciseId === session.pendingRestExerciseId
      ? {
          ...entry,
          sets: entry.sets.map((set, i) => (i === session.pendingRestSetIndex ? { ...set, restTakenSeconds } : set)),
        }
      : entry,
  )
}

// Valide la série en cours et enchaîne directement sur la suite (série
// suivante, écran de choix d'exercice, ou fin de séance) — pas d'étape de
// confirmation intermédiaire : impraticable les mains sur la barre. Le
// repos démarre automatiquement et continue de courir pendant l'écran
// suivant, quel qu'il soit, jusqu'à la prochaine validation.
export function validateCurrentSet(sessions, sessionId) {
  const session = getSessionById(sessions, sessionId)
  if (!session) return sessions

  const entries = closeOutPendingRest(session, session.entries)

  const currentEntry = entries.find((e) => e.exerciseId === session.currentExerciseId)
  const nextSetIndex = session.currentSetIndex + 1
  const exerciseFinished = nextSetIndex >= currentEntry.sets.length

  const restStart = {
    restStartedAt: Date.now(),
    restUntil: Date.now() + session.restSeconds * 1000,
    pendingRestExerciseId: session.currentExerciseId,
    pendingRestSetIndex: session.currentSetIndex,
  }

  if (!exerciseFinished) {
    return updateSession(sessions, sessionId, {
      entries,
      phase: 'exercise',
      currentSetIndex: nextSetIndex,
      ...restStart,
    })
  }

  const completedExerciseIds = session.completedExerciseIds.includes(session.currentExerciseId)
    ? session.completedExerciseIds
    : [...session.completedExerciseIds, session.currentExerciseId]
  const remaining = entries.filter((e) => !completedExerciseIds.includes(e.exerciseId))

  if (remaining.length === 0) {
    return updateSession(sessions, sessionId, {
      entries,
      phase: 'finished',
      currentExerciseId: null,
      finishedAt: Date.now(),
      restUntil: null,
      restStartedAt: null,
      pendingRestExerciseId: null,
      pendingRestSetIndex: null,
      completedExerciseIds,
    })
  }

  return updateSession(sessions, sessionId, {
    entries,
    phase: 'picking',
    currentExerciseId: null,
    completedExerciseIds,
    ...restStart,
  })
}

// Revient à la série précédente du même exercice pour corriger une valeur
// mal saisie — ne touche à aucune donnée, déplace juste le curseur.
export function goToPreviousSet(sessions, sessionId) {
  const session = getSessionById(sessions, sessionId)
  if (!session || session.currentSetIndex <= 0) return sessions

  return updateSession(sessions, sessionId, { currentSetIndex: session.currentSetIndex - 1 })
}

// Ouvre l'écran listant tous les exercices de la séance (faits ou non) sans
// rien modifier — le repos en cours, s'il y en a un, continue de courir.
export function goToExerciseList(sessions, sessionId) {
  return updateSession(sessions, sessionId, { phase: 'picking' })
}

// Termine l'exercice en cours avec seulement les séries déjà validées : la
// série en cours de saisie (jamais validée) est abandonnée plutôt que
// complétée avec des valeurs arbitraires.
export function finishCurrentExerciseEarly(sessions, sessionId) {
  const session = getSessionById(sessions, sessionId)
  if (!session) return sessions

  let entries = session.entries.map((entry) =>
    entry.exerciseId === session.currentExerciseId
      ? { ...entry, sets: entry.sets.slice(0, session.currentSetIndex) }
      : entry,
  )
  entries = closeOutPendingRest(session, entries)

  const completedExerciseIds = session.completedExerciseIds.includes(session.currentExerciseId)
    ? session.completedExerciseIds
    : [...session.completedExerciseIds, session.currentExerciseId]
  const remaining = entries.filter((e) => !completedExerciseIds.includes(e.exerciseId))

  return updateSession(sessions, sessionId, {
    entries,
    phase: remaining.length === 0 ? 'finished' : 'picking',
    currentExerciseId: null,
    currentSetIndex: 0,
    finishedAt: remaining.length === 0 ? Date.now() : null,
    restUntil: null,
    restStartedAt: null,
    pendingRestExerciseId: null,
    pendingRestSetIndex: null,
    completedExerciseIds,
  })
}

// Étape 4 -> étape 2 : reprend sur l'exercice choisi, qu'il soit déjà fait
// ou non (permet d'y retourner corriger une valeur). Sur un exercice déjà
// complété, on se place sur sa dernière série plutôt que la première, pour
// ne pas avoir à tout re-parcourir juste pour corriger la fin.
export function pickExercise(sessions, sessionId, exerciseId) {
  const session = getSessionById(sessions, sessionId)
  if (!session) return sessions

  const entry = session.entries.find((e) => e.exerciseId === exerciseId)
  const alreadyCompleted = session.completedExerciseIds.includes(exerciseId)
  const startIndex = alreadyCompleted ? Math.max(0, entry.sets.length - 1) : 0

  return updateSession(sessions, sessionId, {
    phase: 'exercise',
    currentExerciseId: exerciseId,
    currentSetIndex: startIndex,
  })
}

// Étape 4 -> fin, sans exiger que tout soit complété (getSessionStatus dans
// domain/sessions.js déduira 'partial' si des exercices restent non faits).
export function finishSessionEarly(sessions, sessionId) {
  const session = getSessionById(sessions, sessionId)
  if (!session) return sessions

  const entries = closeOutPendingRest(session, session.entries)

  return updateSession(sessions, sessionId, {
    entries,
    phase: 'finished',
    currentExerciseId: null,
    finishedAt: Date.now(),
    restUntil: null,
    restStartedAt: null,
    pendingRestExerciseId: null,
    pendingRestSetIndex: null,
  })
}
