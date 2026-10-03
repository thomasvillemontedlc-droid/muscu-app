import { createEmptyData, SCHEMA_VERSION } from './schema.js'
import { seedDefaultExercises } from '../domain/exercises.js'

const STORAGE_KEY = 'muscu-app-data'

// Un nouvel utilisateur (pas de données du tout) part directement avec le
// catalogue complet plutôt que de passer par migrate() : ce n'est pas une
// migration de données existantes, juste l'état de départ normal.
export function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return { ...createEmptyData(), exercises: seedDefaultExercises([]) }

  try {
    return migrate(JSON.parse(raw))
  } catch {
    return { ...createEmptyData(), exercises: seedDefaultExercises([]) }
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
  const previousVersion = data.version ?? 0
  let migrated = previousVersion === SCHEMA_VERSION ? data : { ...createEmptyData(), ...data, version: SCHEMA_VERSION }

  // v1 -> v2 : complète le catalogue avec les exercices de la base fournie
  // (exercices-musculation.md, voir domain/muscleGroups.js) qui n'y sont pas
  // déjà, sans toucher aux exercices existants ni à l'historique. Gardé
  // derrière le numéro de version pour ne le faire qu'une fois par
  // utilisateur plutôt qu'à chaque chargement une fois le catalogue complet
  // (voir aussi le bouton "Réinitialiser le catalogue d'exercices" dans
  // Réglages, pour forcer un nouveau passage à la demande).
  if (previousVersion < 2) {
    migrated = { ...migrated, exercises: seedDefaultExercises(migrated.exercises) }
  }

  // v2 -> v3 : ajoute le programme hebdomadaire (vide) et ses réglages de
  // rotation, absents des données existantes. Les deux sont remplacés à
  // l'étape v3 -> v4 ci-dessous ; gardé pour migrer correctement des
  // données restées bloquées en v2 (import d'un ancien export, par ex.).
  if (previousVersion < 3) {
    migrated = {
      ...migrated,
      weeklyProgram: migrated.weeklyProgram ?? { templateIds: [], blockStartDate: null },
      settings: { rotationWeeks: 4, ...migrated.settings },
    }
  }

  // v3 -> v4 : remplace le programme hebdomadaire tournant unique
  // (weeklyProgram + rotation réglable) par deux programmes qui alternent
  // (voir domain/program.js) - l'existant devient le "Programme 1", le
  // second reste à composer. rotationWeeks n'a plus de sens (remplacé par
  // alternation.periodWeeks, à régler une fois le 2e programme créé).
  if (previousVersion < 4) {
    const { rotationWeeks: _rotationWeeks, ...settingsRest } = migrated.settings ?? {}
    migrated = {
      ...migrated,
      programs: [{ templateIds: migrated.weeklyProgram?.templateIds ?? [] }, null],
      alternation: { periodWeeks: 4, startDate: null },
      settings: settingsRest,
    }
    delete migrated.weeklyProgram
  }

  return migrated
}
