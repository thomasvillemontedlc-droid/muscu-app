import { createId } from '../storage/ids.js'

function normalize(name) {
  return name.trim().toLowerCase()
}

export function findExerciseByName(exercises, name) {
  const normalized = normalize(name)
  return exercises.find((e) => normalize(e.name) === normalized)
}

// Réutilise l'exercice existant s'il porte déjà ce nom (même id partout),
// sinon en crée un nouveau. C'est ce qui permet de retrouver l'historique
// d'un exercice même s'il apparaît dans plusieurs séances types.
export function getOrCreateExercise(exercises, name) {
  const trimmed = name.trim()
  const existing = findExerciseByName(exercises, trimmed)
  if (existing) return { exercise: existing, exercises }

  const exercise = { id: createId(), name: trimmed }
  return { exercise, exercises: [...exercises, exercise] }
}

export function getExerciseById(exercises, id) {
  return exercises.find((e) => e.id === id)
}
