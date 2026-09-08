import { createEmptyData, SCHEMA_VERSION } from './schema.js'

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
  // rien à migrer pour l'instant : la v1 est le premier format
  if (data.version === SCHEMA_VERSION) return data
  return { ...createEmptyData(), ...data, version: SCHEMA_VERSION }
}
