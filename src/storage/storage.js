import { createEmptyData, SCHEMA_VERSION } from './schema.js'
import { seedDefaultExercises } from '../domain/exercises.js'

const STORAGE_KEY = 'muscu-app-data'

export function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return createEmptyData()

  try {
    return migrate(JSON.parse(raw))
  } catch {
    return createEmptyData()
  }
}

export function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function parseImportedData(jsonText) {
  const parsed = JSON.parse(jsonText)
  if (!Array.isArray(parsed.exercises) || !Array.isArray(parsed.templates) || !Array.isArray(parsed.sessions)) {
    throw new Error('Fichier invalide : structure inattendue.')
  }
  return migrate(parsed)
}

function migrate(data) {
  // rien à migrer pour l'instant côté schéma : la v1 est le premier format
  const versioned = data.version === SCHEMA_VERSION ? data : { ...createEmptyData(), ...data, version: SCHEMA_VERSION }

  // Complète le catalogue d'exercices à chaque chargement (idempotent, voir
  // domain/exercises.js#seedDefaultExercises) plutôt que de dépendre d'une
  // migration ponctuelle : une mise à jour future de la base d'exercices se
  // propage automatiquement sans bump de version.
  return { ...versioned, exercises: seedDefaultExercises(versioned.exercises) }
}
