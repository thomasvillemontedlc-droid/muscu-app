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

// Mode de saisie du poids, mémorisé par exercice : 'total' (par défaut) ou
// 'perSide' (barre + poids par côté, pour charges symétriques). Le poids
// total reste ce qui est stocké et comparé dans l'historique (voir
// components/WeightField.jsx) ; ces deux champs ne sont qu'une préférence de
// saisie.
export function setExerciseWeightMode(exercises, exerciseId, weightInputMode) {
  return exercises.map((e) => (e.id === exerciseId ? { ...e, weightInputMode } : e))
}

export function setExerciseBarWeight(exercises, exerciseId, barWeight) {
  return exercises.map((e) => (e.id === exerciseId ? { ...e, barWeight } : e))
}
