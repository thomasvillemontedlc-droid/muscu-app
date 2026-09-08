import { createId } from '../storage/ids.js'
import { getExerciseById } from './exercises.js'
import { getLastPerformance } from './history.js'

// Crée une nouvelle séance à partir d'un template, en pré-remplissant chaque
// exercice avec les poids/reps de la dernière fois (moins de saisie = mieux).
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
    done: false,
    entries,
  }

  return { session, sessions: [...sessions, session] }
}

export function getSessionById(sessions, sessionId) {
  return sessions.find((s) => s.id === sessionId)
}

export function updateSession(sessions, sessionId, changes) {
  return sessions.map((s) => (s.id === sessionId ? { ...s, ...changes } : s))
}

export function markSessionDone(sessions, sessionId, done) {
  return updateSession(sessions, sessionId, { done })
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

export function updateSet(sessions, sessionId, exerciseId, setIndex, changes) {
  return mapEntry(sessions, sessionId, exerciseId, (entry) => ({
    ...entry,
    sets: entry.sets.map((set, i) => (i === setIndex ? { ...set, ...changes } : set)),
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
