import { createId } from '../storage/ids.js'
import { getSeedExercises, resolveExerciseCanonicalKey } from './muscleGroups.js'

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

// Ajoute au catalogue les exercices de la base fournie
// (exercices-musculation.md, voir domain/muscleGroups.js) qui n'y sont pas
// déjà couverts, sans toucher aux exercices existants ni en créer de
// doublon — "couvert" veut dire même nom normalisé OU même exercice
// résolu via un alias (ex. le "Gainage" de l'utilisateur couvre déjà notre
// "Gainage planche", pas besoin de semer les deux). Idempotent : peut être
// rappelée à chaque chargement sans effet une fois le catalogue complet.
// Les muscles ne sont jamais stockés sur l'exercice lui-même : ils restent
// dérivés à la volée par getExerciseMuscles() à partir du nom, ce qui fait
// qu'une correction future de la base profite aussi aux exercices déjà
// semés ou saisis à la main.
export function seedDefaultExercises(exercises) {
  const existingNames = new Set()
  const coveredKeys = new Set()

  for (const e of exercises) {
    existingNames.add(normalize(e.name))
    const key = resolveExerciseCanonicalKey(e.name)
    if (key) coveredKeys.add(key)
  }

  const toAdd = getSeedExercises()
    .filter(({ key, name }) => !coveredKeys.has(key) && !existingNames.has(normalize(name)))
    .map(({ name }) => ({ id: createId(), name }))

  return toAdd.length > 0 ? [...exercises, ...toAdd] : exercises
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

// Pas d'incrément des boutons +/- de charge, mémorisé par exercice (voir
// components/WeightField.jsx#getDefaultWeightStep pour la valeur par défaut
// tant que rien n'est mémorisé ici).
export function setExerciseWeightStep(exercises, exerciseId, weightStep) {
  return exercises.map((e) => (e.id === exerciseId ? { ...e, weightStep } : e))
}
