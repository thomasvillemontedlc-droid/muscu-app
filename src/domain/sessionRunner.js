import { getLastPerformance } from './history.js'
import { getEffectiveWeightStep } from './exercises.js'
import { getExerciseMuscles, getExerciseUnit } from './muscleGroups.js'
import { expandForSides, getSessionById, updateSession, withTarget } from './sessions.js'
import { getWorkSets, isWarmupSet } from './setKinds.js'
import { getGoalDefaultReps } from './trainingGoal.js'

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
// création de la séance ; à défaut (jamais fait), les reps par défaut
// suivent l'objectif Force/Endurance de la séance s'il est réglé (voir
// setSessionGoal), sinon 0 comme avant.
export function addExerciseEntryToSession(sessions, sessionId, exercise) {
  const session = getSessionById(sessions, sessionId)
  if (!session) return sessions

  const otherSessions = sessions.filter((s) => s.id !== sessionId)
  const last = getLastPerformance(otherSessions, exercise.id)
  const goalReps = session.goal ? getGoalDefaultReps(session.goal) : null
  const fallbackReps = goalReps != null && getExerciseUnit(exercise.name) !== 'time' ? goalReps : 0
  const fallbackSets = expandForSides([{ weight: 0, reps: fallbackReps }], exercise.unilateral)

  const entry = {
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    sets: last ? last.sets.map(withTarget) : fallbackSets.map(withTarget),
  }

  return updateSession(sessions, sessionId, { entries: [...session.entries, entry] })
}

// Choisit l'objectif Force/Endurance de la séance (ou le réinitialise à
// neutre avec goal=null) et ajuste aussitôt les répétitions par défaut des
// exercices SANS historique réel (voir domain/trainingGoal.js) : un exercice
// déjà fait avant garde sa dernière vraie performance, jamais écrasée ici.
// Les exercices "au temps" (gainage...) ne sont jamais touchés, reps y
// représente une durée, pas un nombre de répétitions.
export function setSessionGoal(sessions, sessionId, goal) {
  const session = getSessionById(sessions, sessionId)
  if (!session) return sessions

  const defaultReps = getGoalDefaultReps(goal)
  const otherSessions = sessions.filter((s) => s.id !== sessionId)

  const entries = session.entries.map((entry) => {
    if (defaultReps == null || getExerciseUnit(entry.exerciseName) === 'time') return entry
    if (getLastPerformance(otherSessions, entry.exerciseId)) return entry
    return { ...entry, sets: entry.sets.map((set) => ({ ...set, reps: defaultReps, targetReps: defaultReps })) }
  })

  return updateSession(sessions, sessionId, { goal, entries })
}

// Exercices du catalogue qui partagent au moins un muscle principal avec
// `exerciseName` (lui-même exclu), pour proposer en tête des remplaçants
// pertinents (ex. "Oiseau à la poulie vis-à-vis" pour "Oiseau haltères
// buste penché").
export function getSameMuscleExerciseIds(exercises, exerciseName) {
  const primary = getExerciseMuscles(exerciseName).primary
  if (primary.length === 0) return []
  return exercises
    .filter((e) => e.name !== exerciseName)
    .filter((e) => getExerciseMuscles(e.name).primary.some((id) => primary.includes(id)))
    .map((e) => e.id)
}

// Remplace un exercice par un autre en pleine séance, à la même place :
// même nombre de séries, séries déjà validées (getResumeSetIndex pour un
// exercice entamé) conservées telles quelles, séries restantes pré-remplies
// avec la dernière performance du nouvel exercice (séries de travail, rang
// par rang, la dernière répétée au-delà). Une série d'échauffement restante
// le reste, à la moitié de la charge (arrondie au pas de l'exercice). Le
// curseur, la complétion et le repos en cours suivent le nouvel id. Sans
// effet si le nouvel exercice est déjà dans la séance.
export function replaceExerciseInSession(sessions, sessionId, oldExerciseId, newExercise) {
  const session = getSessionById(sessions, sessionId)
  if (!session || session.entries.some((e) => e.exerciseId === newExercise.id)) return sessions
  const oldEntry = session.entries.find((e) => e.exerciseId === oldExerciseId)
  if (!oldEntry) return sessions

  const otherSessions = sessions.filter((s) => s.id !== sessionId)
  const last = getLastPerformance(otherSessions, newExercise.id)
  const completed = session.completedExerciseIds.includes(oldExerciseId)
  const doneCount = completed ? oldEntry.sets.length : getResumeSetIndex(session, oldEntry)
  const sameUnit = getExerciseUnit(oldEntry.exerciseName) === getExerciseUnit(newExercise.name)
  const step = getEffectiveWeightStep(newExercise)

  const sets = oldEntry.sets.map((set, i) => {
    if (i < doneCount) return set
    const workIndex = getWorkSets(oldEntry.sets.slice(0, i)).length
    const source = last ? (last.sets[workIndex] ?? last.sets[last.sets.length - 1]) : null
    const reps = source ? source.reps : sameUnit ? set.reps : 0
    let weight = source ? source.weight : 0
    if (isWarmupSet(set)) weight = Math.round(weight / 2 / step) * step
    const next = { weight: Math.round(weight * 100) / 100, reps }
    if (set.side) next.side = set.side
    if (isWarmupSet(set)) next.warmup = true
    return withTarget(next)
  })

  const { chargeSuggestionResolved: _resolved, feeling: _feeling, ...rest } = oldEntry
  const entry = { ...rest, exerciseId: newExercise.id, exerciseName: newExercise.name, sets }
  const swap = (id) => (id === oldExerciseId ? newExercise.id : id)

  return updateSession(sessions, sessionId, {
    entries: session.entries.map((e) => (e.exerciseId === oldExerciseId ? entry : e)),
    currentExerciseId: swap(session.currentExerciseId),
    completedExerciseIds: session.completedExerciseIds.map(swap),
    pendingRestExerciseId: swap(session.pendingRestExerciseId),
  })
}

export function removeExerciseEntryFromSession(sessions, sessionId, exerciseId) {
  const session = getSessionById(sessions, sessionId)
  if (!session) return sessions

  const entries = session.entries.filter((e) => e.exerciseId !== exerciseId)
  return updateSession(sessions, sessionId, { entries })
}

export function setRestSeconds(sessions, sessionId, restSeconds) {
  return updateSession(sessions, sessionId, { restSeconds })
}

// Ajuste le temps restant d'un repos déjà en cours (boutons +15s/-15s) : on
// modifie restSeconds, pas restStartedAt, donc le chrono continue de courir
// sans se réinitialiser (voir useRestTimer.js, remainingMs recalculé à
// partir des deux). Peut faire passer sous zéro comme au-dessus, le
// dépassement se comporte alors normalement. Si l'ajustement fait revenir
// le décompte au-dessus de zéro, l'alarme est réarmée (restAlarmPlayedAt
// remis à null) pour sonner au prochain passage à zéro.
export function adjustRestSeconds(sessions, sessionId, deltaSeconds) {
  const session = getSessionById(sessions, sessionId)
  if (!session) return sessions

  const restSeconds = session.restSeconds + deltaSeconds
  const backAboveZero =
    session.restStartedAt != null && session.restStartedAt + restSeconds * 1000 > Date.now()
  return updateSession(sessions, sessionId, {
    restSeconds,
    ...(backAboveZero && { restAlarmPlayedAt: null }),
  })
}

// Mémorise que l'alarme de fin du repos en cours a sonné (voir
// hooks/useRestTimer.js) : elle ne sera jamais rejouée pour ce repos, même
// après un changement d'écran ou un rechargement de l'app.
export function markRestAlarmPlayed(sessions, sessionId, playedAt = Date.now()) {
  return updateSession(sessions, sessionId, { restAlarmPlayedAt: playedAt })
}

// Étape 1 -> étape 2 : démarre sur le premier exercice de la liste.
// "Commencer par" n'est pas un champ séparé (source de désync avec l'ordre
// réel après un glisser-déposer) : c'est toujours entries[0]. Choisir un
// autre exercice de départ (PrepView) revient simplement à le réordonner en
// première position via reorderSessionEntries.
export function startSession(sessions, sessionId) {
  const session = getSessionById(sessions, sessionId)
  if (!session) return sessions

  return updateSession(sessions, sessionId, {
    phase: 'exercise',
    currentExerciseId: session.entries[0]?.exerciseId ?? null,
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

  // doneSetCount : progression mémorisée par exercice (séries validées),
  // pour reprendre au bon endroit après un détour par la liste (voir
  // getResumeSetIndex). Jamais diminué : revenir corriger une série
  // précédente puis la revalider ne fait pas "oublier" les suivantes.
  const entries = closeOutPendingRest(session, session.entries).map((entry) =>
    entry.exerciseId === session.currentExerciseId
      ? { ...entry, doneSetCount: Math.max(entry.doneSetCount ?? 0, session.currentSetIndex + 1) }
      : entry,
  )

  const currentEntry = entries.find((e) => e.exerciseId === session.currentExerciseId)
  const nextSetIndex = session.currentSetIndex + 1
  const exerciseFinished = nextSetIndex >= currentEntry.sets.length

  const restStart = {
    restStartedAt: Date.now(),
    restUntil: Date.now() + session.restSeconds * 1000,
    pendingRestExerciseId: session.currentExerciseId,
    pendingRestSetIndex: session.currentSetIndex,
    // Nouveau repos : son alarme n'a pas encore sonné.
    restAlarmPlayedAt: null,
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

// Coupe court au repos en cours, pour ceux qui veulent enchaîner plus tôt.
// Enregistre quand même le temps de repos réellement pris sur la série qui
// l'a déclenché (via closeOutPendingRest), comme une fin de repos normale —
// seulement plus courte que la durée programmée.
export function skipRest(sessions, sessionId) {
  const session = getSessionById(sessions, sessionId)
  if (!session || session.restStartedAt == null) return sessions

  const entries = closeOutPendingRest(session, session.entries)

  return updateSession(sessions, sessionId, {
    entries,
    restStartedAt: null,
    restUntil: null,
    pendingRestExerciseId: null,
    pendingRestSetIndex: null,
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

// Série sur laquelle reprendre un exercice : sa dernière série s'il est
// déjà complété (pour ne pas tout re-parcourir juste pour corriger la fin),
// sinon la première série non validée (entry.doneSetCount, voir
// validateCurrentSet). Séances en cours d'avant ce champ : l'exercice
// courant reprend là où était le curseur (goToExerciseList le conserve).
export function getResumeSetIndex(session, entry) {
  const lastIndex = Math.max(0, entry.sets.length - 1)
  if (session.completedExerciseIds.includes(entry.exerciseId)) return lastIndex
  const fallback = entry.exerciseId === session.currentExerciseId ? session.currentSetIndex : 0
  return Math.min(entry.doneSetCount ?? fallback, lastIndex)
}

// Étape 4 -> étape 2 : reprend sur l'exercice choisi, qu'il soit déjà fait
// ou non (permet d'y retourner corriger une valeur), à la série donnée par
// getResumeSetIndex. Ne touche à aucune valeur saisie : déplace juste le
// curseur.
export function pickExercise(sessions, sessionId, exerciseId) {
  const session = getSessionById(sessions, sessionId)
  if (!session) return sessions

  const entry = session.entries.find((e) => e.exerciseId === exerciseId)
  const startIndex = getResumeSetIndex(session, entry)

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
