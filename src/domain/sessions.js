import { createId } from '../storage/ids.js'
import { getExerciseById } from './exercises.js'
import { getLastPerformance } from './history.js'

// Crée une nouvelle séance à partir d'un template, en pré-remplissant chaque
// exercice avec les poids/reps de la dernière fois (moins de saisie = mieux).
// La séance démarre en phase "prep" (écran de préparation), voir
// domain/sessionRunner.js pour la suite du déroulé guidé.
export function startSessionFromTemplate(sessions, template, exercises) {
  const entries = template.exerciseIds.map((exerciseId) => {
    const exercise = getExerciseById(exercises, exerciseId)
    const last = getLastPerformance(sessions, exerciseId)

    return {
      exerciseId,
      exerciseName: exercise?.name ?? 'Exercice supprimé',
      sets: last ? last.sets.map((set) => ({ ...set })) : [{ weight: 0, reps: 0 }],
    }
  })

  const session = {
    id: createId(),
    templateId: template.id,
    templateName: template.name,
    date: new Date().toISOString(),
    entries,
    phase: 'prep',
    restSeconds: getDefaultRestSeconds(sessions),
    restUntil: null,
    restStartedAt: null,
    pendingRestExerciseId: null,
    pendingRestSetIndex: null,
    startingExerciseId: template.exerciseIds[0] ?? null,
    currentExerciseId: null,
    currentSetIndex: 0,
    completedExerciseIds: [],
  }

  return { session, sessions: [...sessions, session] }
}

// Reprend le dernier temps de repos choisi par l'utilisateur, pour éviter de
// le ressaisir à chaque séance (moins de saisie = mieux).
function getDefaultRestSeconds(sessions) {
  for (let i = sessions.length - 1; i >= 0; i--) {
    if (typeof sessions[i].restSeconds === 'number') return sessions[i].restSeconds
  }
  return 90
}

export function getSessionById(sessions, sessionId) {
  return sessions.find((s) => s.id === sessionId)
}

// Statut dérivé (jamais stocké) : évite un champ à garder synchronisé et
// gère pour "gratuit" le cas où l'utilisateur ferme l'app en plein milieu
// d'une séance sans jamais cliquer un bouton de fin.
// - 'done'      : phase 'finished' et tous les exercices prévus complétés
// - 'partial'   : arrêtée via "Terminer la séance", ou abandonnée après au
//                 moins un exercice entièrement fait
// - 'not-done'  : jamais démarrée, ou abandonnée avant d'avoir fini le tout
//                 premier exercice
export function getSessionStatus(session) {
  const completedCount = session.completedExerciseIds?.length ?? 0
  const totalCount = session.entries.length

  if (session.phase === 'finished') {
    return completedCount >= totalCount ? 'done' : 'partial'
  }
  if (!session.phase || session.phase === 'prep') {
    // Séances créées avant l'introduction des phases (repli sur l'ancien champ)
    return session.done ? 'done' : 'not-done'
  }
  return completedCount > 0 ? 'partial' : 'not-done'
}

// Filtre les séances pour l'export ciblé vers une IA (Réglages). "last" =
// la plus récente séance (peu importe son statut), pas forcément celle
// juste terminée si l'utilisateur navigue plus tard.
export function filterSessionsByScope(sessions, scope, now = new Date()) {
  if (scope === 'last') {
    const latest = [...sessions].sort((a, b) => b.date.localeCompare(a.date))[0]
    return latest ? [latest] : []
  }
  if (scope === '7days') {
    const cutoff = new Date(now)
    cutoff.setDate(cutoff.getDate() - 7)
    return sessions.filter((s) => new Date(s.date) >= cutoff)
  }
  if (scope === 'month') {
    const year = now.getFullYear()
    const month = now.getMonth()
    return sessions.filter((s) => {
      const d = new Date(s.date)
      return d.getFullYear() === year && d.getMonth() === month
    })
  }
  return sessions
}

export function updateSession(sessions, sessionId, changes) {
  return sessions.map((s) => (s.id === sessionId ? { ...s, ...changes } : s))
}

export function deleteSession(sessions, sessionId) {
  return sessions.filter((s) => s.id !== sessionId)
}

export function addSet(sessions, sessionId, exerciseId, set = { weight: 0, reps: 0 }) {
  return mapEntry(sessions, sessionId, exerciseId, (entry) => ({
    ...entry,
    sets: [...entry.sets, { ...set }],
  }))
}

export function removeSet(sessions, sessionId, exerciseId, setIndex) {
  return mapEntry(sessions, sessionId, exerciseId, (entry) => ({
    ...entry,
    sets: entry.sets.filter((_, i) => i !== setIndex),
  }))
}

// Modifie une série ET toutes celles qui suivent dans le même exercice, qui
// n'ont pas encore été faites (les séries validées avant setIndex ne sont
// jamais touchées, puisqu'on ne modifie que la série en cours et le futur).
// Ça évite de garder le pré-remplissage de la séance précédente sur les
// séries suivantes une fois qu'on a corrigé la charge en cours de séance.
export function updateSet(sessions, sessionId, exerciseId, setIndex, changes) {
  return mapEntry(sessions, sessionId, exerciseId, (entry) => ({
    ...entry,
    sets: entry.sets.map((set, i) => (i >= setIndex ? { ...set, ...changes } : set)),
  }))
}

function mapEntry(sessions, sessionId, exerciseId, transform) {
  return sessions.map((s) => {
    if (s.id !== sessionId) return s
    return {
      ...s,
      entries: s.entries.map((entry) => (entry.exerciseId === exerciseId ? transform(entry) : entry)),
    }
  })
}
