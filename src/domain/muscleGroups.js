import { slugify } from '../lib/slugify.js'

// Liste standard des groupes musculaires suivis par l'app, dans l'ordre où
// ils doivent apparaître dans les listes (récupération, muscles négligés).
export const MUSCLE_GROUPS = [
  'pectoraux',
  'dorsaux',
  'trapezes',
  'deltoides',
  'biceps',
  'triceps',
  'abdominaux',
  'lombaires',
  'quadriceps',
  'ischio-jambiers',
  'fessiers',
  'mollets',
  'adducteurs',
  'abducteurs',
]

const MUSCLE_LABELS = {
  pectoraux: 'Pectoraux',
  dorsaux: 'Dorsaux',
  trapezes: 'Trapèzes',
  deltoides: 'Deltoïdes',
  biceps: 'Biceps',
  triceps: 'Triceps',
  abdominaux: 'Abdominaux',
  lombaires: 'Lombaires',
  quadriceps: 'Quadriceps',
  'ischio-jambiers': 'Ischio-jambiers',
  fessiers: 'Fessiers',
  mollets: 'Mollets',
  adducteurs: 'Adducteurs',
  abducteurs: 'Abducteurs',
}

export function getMuscleLabel(muscleId) {
  return MUSCLE_LABELS[muscleId] ?? muscleId
}

// Association exercice -> muscles sollicités (principal / secondaire), clé =
// nom d'exercice slugifié. Registre statique dans le code (même principe que
// illustrations/registry.js) : les exercices sont du texte libre saisi par
// l'utilisateur, il n'y a pas de catalogue fermé en base. Un exercice non
// reconnu ici ne fait s'allumer aucun muscle sur la carte de chaleur - c'est
// la même dégradation gracieuse que le schéma générique des illustrations.
const EXERCISE_MUSCLES = {
  'developpe-couche': { primary: ['pectoraux'], secondary: ['triceps', 'deltoides'] },
  'developpe-incline': { primary: ['pectoraux'], secondary: ['deltoides', 'triceps'] },
  'developpe-decline': { primary: ['pectoraux'], secondary: ['triceps'] },
  'developpe-militaire': { primary: ['deltoides'], secondary: ['triceps', 'trapezes'] },
  'developpe-haltere': { primary: ['deltoides'], secondary: ['triceps'] },
  'ecarte-couche': { primary: ['pectoraux'], secondary: [] },
  dips: { primary: ['triceps', 'pectoraux'], secondary: ['deltoides'] },
  pompes: { primary: ['pectoraux'], secondary: ['triceps', 'deltoides'] },

  squat: { primary: ['quadriceps', 'fessiers'], secondary: ['ischio-jambiers', 'lombaires'] },
  'squat-bulgare': { primary: ['quadriceps', 'fessiers'], secondary: ['ischio-jambiers'] },
  'presse-a-cuisses': { primary: ['quadriceps', 'fessiers'], secondary: ['ischio-jambiers'] },
  fentes: { primary: ['quadriceps', 'fessiers'], secondary: ['ischio-jambiers'] },
  'leg-extension': { primary: ['quadriceps'], secondary: [] },
  'leg-curl': { primary: ['ischio-jambiers'], secondary: [] },
  'souleve-de-terre': { primary: ['ischio-jambiers', 'lombaires'], secondary: ['fessiers', 'dorsaux', 'trapezes'] },
  'souleve-de-terre-roumain': { primary: ['ischio-jambiers', 'fessiers'], secondary: ['lombaires'] },
  'hip-thrust': { primary: ['fessiers'], secondary: ['ischio-jambiers'] },
  'mollets-debout': { primary: ['mollets'], secondary: [] },
  'mollets-assis': { primary: ['mollets'], secondary: [] },

  tractions: { primary: ['dorsaux'], secondary: ['biceps', 'trapezes'] },
  'tirage-vertical': { primary: ['dorsaux'], secondary: ['biceps'] },
  'tirage-horizontal': { primary: ['dorsaux'], secondary: ['biceps', 'trapezes'] },
  'rowing-barre': { primary: ['dorsaux'], secondary: ['biceps', 'trapezes', 'lombaires'] },
  'rowing-haltere': { primary: ['dorsaux'], secondary: ['biceps', 'trapezes'] },
  shrugs: { primary: ['trapezes'], secondary: [] },
  'oiseau': { primary: ['deltoides'], secondary: ['trapezes'] },
  'elevations-laterales': { primary: ['deltoides'], secondary: [] },
  'elevations-frontales': { primary: ['deltoides'], secondary: [] },

  'curl-biceps': { primary: ['biceps'], secondary: [] },
  'curl-marteau': { primary: ['biceps'], secondary: [] },
  'extension-triceps': { primary: ['triceps'], secondary: [] },
  'extension-triceps-poulie': { primary: ['triceps'], secondary: [] },

  gainage: { primary: ['abdominaux'], secondary: ['lombaires'] },
  planche: { primary: ['abdominaux'], secondary: ['lombaires'] },
  crunch: { primary: ['abdominaux'], secondary: [] },
  'releve-de-jambes': { primary: ['abdominaux'], secondary: [] },
  'adducteurs-machine': { primary: ['adducteurs'], secondary: [] },
  'abducteurs-machine': { primary: ['abducteurs'], secondary: [] },
}

const EMPTY_MUSCLES = { primary: [], secondary: [] }

export function getExerciseMuscles(exerciseName) {
  return EXERCISE_MUSCLES[slugify(exerciseName)] ?? EMPTY_MUSCLES
}
