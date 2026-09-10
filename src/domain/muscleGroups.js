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
// nom d'exercice slugifié. Registre statique dans le code : les exercices
// sont du texte libre saisi par l'utilisateur, il n'y a pas de catalogue
// fermé en base. Un exercice non reconnu ici ne fait s'allumer aucun muscle
// sur la carte de chaleur.
//
// Généré à partir de la base fournie par l'utilisateur (~130 exercices,
// classés par groupe musculaire avec muscle principal / secondaires). Les
// qualificatifs entre parenthèses de la source (ex. "pectoraux (faisceau
// supérieur)") sont réduits au groupe de base, et les muscles hors des 14
// groupes suivis par l'app (avant-bras, tibial antérieur, fléchisseurs de
// hanche, brachial, obliques) sont soit repliés sur le groupe suivi le plus
// proche (obliques -> abdominaux), soit ignorés quand ils n'apportent rien
// d'exploitable (ex. curls de poignets, qui ne touchent aucun des 14
// groupes). Un même exercice listé dans plusieurs sections de la source
// (exercices polyarticulaires) est fusionné en une seule entrée plutôt que
// dupliqué.
const EXERCISE_MUSCLES = {
  // Pectoraux
  'developpe-couche-barre': { primary: ['pectoraux'], secondary: ['triceps', 'deltoides'] },
  'developpe-couche-halteres': { primary: ['pectoraux'], secondary: ['triceps', 'deltoides'] },
  'developpe-incline-barre': { primary: ['pectoraux'], secondary: ['deltoides', 'triceps'] },
  'developpe-incline-halteres': { primary: ['pectoraux'], secondary: ['deltoides', 'triceps'] },
  'developpe-decline-barre': { primary: ['pectoraux'], secondary: ['triceps'] },
  'developpe-a-la-machine-convergente': { primary: ['pectoraux'], secondary: ['triceps', 'deltoides'] },
  'ecarte-couche-halteres': { primary: ['pectoraux'], secondary: ['deltoides'] },
  'ecarte-incline-halteres': { primary: ['pectoraux'], secondary: ['deltoides'] },
  'ecarte-a-la-poulie-vis-a-vis': { primary: ['pectoraux'], secondary: ['deltoides'] },
  'pec-deck-butterfly': { primary: ['pectoraux'], secondary: ['deltoides'] },
  pompes: { primary: ['pectoraux'], secondary: ['triceps', 'deltoides', 'abdominaux'] },
  'pompes-declinees': { primary: ['pectoraux'], secondary: ['triceps', 'deltoides'] },
  'pompes-diamant': { primary: ['triceps'], secondary: ['pectoraux', 'deltoides'] },
  'dips-sur-barres-paralleles-buste-penche': { primary: ['pectoraux'], secondary: ['triceps', 'deltoides'] },
  'pull-over-haltere': { primary: ['pectoraux'], secondary: ['dorsaux', 'triceps'] },

  // Dorsaux
  'tractions-pronation': { primary: ['dorsaux'], secondary: ['biceps', 'trapezes'] },
  'tractions-supination': { primary: ['dorsaux'], secondary: ['biceps'] },
  'tractions-prise-neutre': { primary: ['dorsaux'], secondary: ['biceps'] },
  'tractions-prise-serree': { primary: ['dorsaux'], secondary: ['biceps'] },
  'tirage-vertical-poulie-haute-pronation': { primary: ['dorsaux'], secondary: ['biceps', 'trapezes'] },
  'tirage-vertical-poulie-haute-supination': { primary: ['dorsaux'], secondary: ['biceps'] },
  'tirage-vertical-prise-neutre': { primary: ['dorsaux'], secondary: ['biceps'] },
  'tirage-horizontal-poulie-basse': { primary: ['dorsaux'], secondary: ['trapezes', 'biceps', 'lombaires'] },
  'rowing-barre-buste-penche': { primary: ['dorsaux'], secondary: ['trapezes', 'biceps', 'lombaires'] },
  'rowing-haltere-unilateral': { primary: ['dorsaux'], secondary: ['trapezes', 'biceps'] },
  'rowing-t-bar': { primary: ['dorsaux'], secondary: ['trapezes', 'biceps'] },
  'rowing-a-la-machine-assis': { primary: ['dorsaux'], secondary: ['trapezes', 'biceps'] },
  'pull-over-a-la-poulie-haute-bras-tendus': { primary: ['dorsaux'], secondary: ['triceps', 'abdominaux'] },
  'souleve-de-terre': {
    primary: ['dorsaux', 'lombaires', 'fessiers', 'ischio-jambiers'],
    secondary: ['trapezes', 'quadriceps'],
  },
  'face-pull': { primary: ['trapezes'], secondary: ['deltoides', 'dorsaux'] },

  // Trapèzes
  'shrugs-barre': { primary: ['trapezes'], secondary: [] },
  'shrugs-halteres': { primary: ['trapezes'], secondary: [] },
  'shrugs-a-la-barre-guidee': { primary: ['trapezes'], secondary: [] },
  'tirage-menton-rowing-vertical': { primary: ['trapezes'], secondary: ['deltoides', 'biceps'] },
  'face-pull-a-la-corde': { primary: ['trapezes'], secondary: ['deltoides'] },
  'farmers-walk': { primary: ['trapezes'], secondary: ['abdominaux', 'quadriceps'] },

  // Deltoïdes
  'developpe-militaire-barre-debout': { primary: ['deltoides'], secondary: ['triceps', 'trapezes'] },
  'developpe-militaire-assis-barre': { primary: ['deltoides'], secondary: ['triceps'] },
  'developpe-halteres-assis': { primary: ['deltoides'], secondary: ['triceps'] },
  'developpe-arnold': { primary: ['deltoides'], secondary: ['triceps'] },
  'developpe-epaules-a-la-machine': { primary: ['deltoides'], secondary: ['triceps'] },
  'elevations-laterales-halteres': { primary: ['deltoides'], secondary: ['trapezes'] },
  'elevations-laterales-a-la-poulie': { primary: ['deltoides'], secondary: ['trapezes'] },
  'elevations-frontales-halteres': { primary: ['deltoides'], secondary: ['pectoraux'] },
  'elevations-frontales-barre': { primary: ['deltoides'], secondary: ['pectoraux'] },
  'oiseau-halteres-buste-penche': { primary: ['deltoides'], secondary: ['trapezes', 'dorsaux'] },
  'oiseau-a-la-poulie-vis-a-vis': { primary: ['deltoides'], secondary: ['trapezes'] },
  'reverse-pec-deck': { primary: ['deltoides'], secondary: ['trapezes'] },

  // Biceps
  'curl-barre-droite': { primary: ['biceps'], secondary: [] },
  'curl-barre-ez': { primary: ['biceps'], secondary: [] },
  'curl-halteres-alternes': { primary: ['biceps'], secondary: [] },
  'curl-halteres-simultanes': { primary: ['biceps'], secondary: [] },
  'curl-marteau': { primary: ['biceps'], secondary: [] },
  'curl-incline-halteres': { primary: ['biceps'], secondary: [] },
  'curl-pupitre-larry-scott': { primary: ['biceps'], secondary: [] },
  'curl-a-la-poulie-basse': { primary: ['biceps'], secondary: [] },
  'curl-a-la-machine': { primary: ['biceps'], secondary: [] },
  'curl-concentre': { primary: ['biceps'], secondary: [] },
  'curl-araignee-spider-curl': { primary: ['biceps'], secondary: [] },

  // Triceps
  'extension-triceps-a-la-poulie-haute-barre': { primary: ['triceps'], secondary: [] },
  'extension-triceps-a-la-poulie-haute-corde': { primary: ['triceps'], secondary: [] },
  'extension-triceps-a-la-poulie-prise-inversee': { primary: ['triceps'], secondary: [] },
  'barre-au-front-skull-crusher': { primary: ['triceps'], secondary: [] },
  'extension-nuque-haltere': { primary: ['triceps'], secondary: [] },
  'extension-nuque-a-la-poulie': { primary: ['triceps'], secondary: [] },
  'kickback-haltere': { primary: ['triceps'], secondary: [] },
  'dips-machine': { primary: ['triceps'], secondary: ['pectoraux', 'deltoides'] },
  'dips-sur-barres-paralleles-buste-droit': { primary: ['triceps'], secondary: ['pectoraux', 'deltoides'] },
  'dips-sur-banc': { primary: ['triceps'], secondary: ['deltoides'] },
  'developpe-couche-prise-serree': { primary: ['triceps'], secondary: ['pectoraux', 'deltoides'] },

  // Abdominaux
  'crunch-au-sol': { primary: ['abdominaux'], secondary: [] },
  'crunch-a-la-poulie-haute': { primary: ['abdominaux'], secondary: [] },
  'crunch-a-la-machine': { primary: ['abdominaux'], secondary: [] },
  'releve-de-jambes-suspendu': { primary: ['abdominaux'], secondary: [] },
  'releve-de-genoux-suspendu': { primary: ['abdominaux'], secondary: [] },
  'releve-de-jambes-au-sol': { primary: ['abdominaux'], secondary: [] },
  'gainage-planche': { primary: ['abdominaux'], secondary: ['lombaires', 'deltoides'] },
  'gainage-lateral': { primary: ['abdominaux'], secondary: [] },
  'russian-twist': { primary: ['abdominaux'], secondary: [] },
  'rotations-a-la-poulie-wood-chop': { primary: ['abdominaux'], secondary: [] },
  'roulette-abdominale-ab-wheel': { primary: ['abdominaux'], secondary: ['lombaires', 'dorsaux'] },
  'mountain-climbers': { primary: ['abdominaux'], secondary: ['deltoides', 'quadriceps'] },
  'sit-up': { primary: ['abdominaux'], secondary: [] },

  // Lombaires
  'extension-lombaire-au-banc': { primary: ['lombaires'], secondary: ['fessiers', 'ischio-jambiers'] },
  'extension-lombaire-a-la-machine': { primary: ['lombaires'], secondary: [] },
  'good-morning-barre': { primary: ['lombaires', 'ischio-jambiers'], secondary: ['fessiers'] },
  'souleve-de-terre-jambes-tendues': { primary: ['ischio-jambiers'], secondary: ['lombaires', 'fessiers'] },
  'superman-au-sol': { primary: ['lombaires'], secondary: ['fessiers'] },
  'hip-thrust': { primary: ['fessiers'], secondary: ['ischio-jambiers', 'lombaires'] },

  // Quadriceps
  'squat-barre-nuque': { primary: ['quadriceps'], secondary: ['fessiers', 'lombaires', 'ischio-jambiers'] },
  'front-squat': { primary: ['quadriceps'], secondary: ['fessiers', 'abdominaux'] },
  'squat-a-la-barre-guidee-smith-machine': { primary: ['quadriceps'], secondary: ['fessiers'] },
  'goblet-squat': { primary: ['quadriceps'], secondary: ['fessiers', 'abdominaux'] },
  'presse-a-cuisses': { primary: ['quadriceps'], secondary: ['fessiers', 'ischio-jambiers'] },
  'hack-squat': { primary: ['quadriceps'], secondary: ['fessiers'] },
  'leg-extension': { primary: ['quadriceps'], secondary: [] },
  'fentes-avant': { primary: ['quadriceps'], secondary: ['fessiers', 'ischio-jambiers'] },
  'fentes-marchees': { primary: ['quadriceps'], secondary: ['fessiers', 'ischio-jambiers'] },
  'fentes-bulgares': { primary: ['quadriceps', 'fessiers'], secondary: [] },
  'step-up-sur-banc': { primary: ['quadriceps'], secondary: ['fessiers'] },
  'sissy-squat': { primary: ['quadriceps'], secondary: [] },

  // Ischio-jambiers
  'leg-curl-allonge': { primary: ['ischio-jambiers'], secondary: ['mollets'] },
  'leg-curl-assis': { primary: ['ischio-jambiers'], secondary: [] },
  'leg-curl-debout-unilateral': { primary: ['ischio-jambiers'], secondary: [] },
  'souleve-de-terre-roumain': { primary: ['ischio-jambiers'], secondary: ['fessiers', 'lombaires'] },
  'nordic-curl': { primary: ['ischio-jambiers'], secondary: ['fessiers'] },

  // Fessiers
  'hip-thrust-barre': { primary: ['fessiers'], secondary: ['ischio-jambiers', 'quadriceps'] },
  'pont-fessier-au-sol': { primary: ['fessiers'], secondary: ['ischio-jambiers'] },
  'kickback-fessier-a-la-poulie': { primary: ['fessiers'], secondary: ['ischio-jambiers'] },
  'abduction-hanche-a-la-machine': { primary: ['fessiers'], secondary: ['abducteurs'] },
  'squat-sumo': { primary: ['fessiers', 'adducteurs'], secondary: ['quadriceps'] },
  'souleve-de-terre-sumo': { primary: ['fessiers'], secondary: ['quadriceps', 'lombaires', 'ischio-jambiers'] },
  'montee-de-banc-lestee': { primary: ['fessiers'], secondary: ['quadriceps'] },

  // Mollets
  'extension-mollets-debout-a-la-machine': { primary: ['mollets'], secondary: [] },
  'extension-mollets-assis': { primary: ['mollets'], secondary: [] },
  'extension-mollets-a-la-presse': { primary: ['mollets'], secondary: [] },
  'extension-mollets-barre-guidee': { primary: ['mollets'], secondary: [] },
  'extension-mollets-un-pied-au-poids-du-corps': { primary: ['mollets'], secondary: [] },
  'marche-sur-la-pointe-des-pieds': { primary: ['mollets'], secondary: [] },
  'marche-sur-les-talons': { primary: ['mollets'], secondary: [] },

  // Adducteurs et abducteurs
  'machine-adducteurs-serrer': { primary: ['adducteurs'], secondary: [] },
  'machine-abducteurs-ecarter': { primary: ['abducteurs'], secondary: ['fessiers'] },
  'adduction-a-la-poulie-basse': { primary: ['adducteurs'], secondary: [] },
  'abduction-a-la-poulie-basse': { primary: ['abducteurs'], secondary: ['fessiers'] },
  'fente-laterale': { primary: ['adducteurs'], secondary: ['quadriceps', 'fessiers'] },
  'marche-laterale-avec-elastique': { primary: ['abducteurs'], secondary: ['fessiers'] },

  // Exercices polyarticulaires (noms génériques, distincts des variantes ci-dessus)
  'squat-barre': { primary: ['quadriceps', 'fessiers'], secondary: ['lombaires', 'ischio-jambiers', 'abdominaux'] },
  'developpe-couche': { primary: ['pectoraux'], secondary: ['triceps', 'deltoides'] },
  tractions: { primary: ['dorsaux'], secondary: ['biceps', 'trapezes'] },
  'developpe-militaire': { primary: ['deltoides'], secondary: ['triceps', 'trapezes', 'abdominaux'] },
  dips: { primary: ['pectoraux', 'triceps'], secondary: ['deltoides'] },
  'clean-and-press': { primary: ['deltoides', 'quadriceps', 'fessiers'], secondary: ['trapezes', 'lombaires', 'triceps'] },
  thruster: { primary: ['quadriceps', 'deltoides'], secondary: ['fessiers', 'triceps'] },
  burpees: { primary: ['quadriceps', 'pectoraux'], secondary: ['abdominaux', 'deltoides', 'triceps'] },
  'kettlebell-swing': { primary: ['fessiers', 'ischio-jambiers'], secondary: ['lombaires', 'deltoides', 'abdominaux'] },

  // Alias génériques : noms courts/sans variante que l'utilisateur est
  // susceptible d'avoir déjà saisis, mappés sur l'entrée la plus proche
  // ci-dessus (base-toi sur le nom, voir la demande d'origine).
  squat: { primary: ['quadriceps', 'fessiers'], secondary: ['lombaires', 'ischio-jambiers', 'abdominaux'] },
  'squat-bulgare': { primary: ['quadriceps', 'fessiers'], secondary: [] },
  fentes: { primary: ['quadriceps'], secondary: ['fessiers', 'ischio-jambiers'] },
  'leg-curl': { primary: ['ischio-jambiers'], secondary: ['mollets'] },
  'mollets-debout': { primary: ['mollets'], secondary: [] },
  'mollets-assis': { primary: ['mollets'], secondary: [] },
  'tirage-vertical': { primary: ['dorsaux'], secondary: ['biceps', 'trapezes'] },
  'tirage-horizontal': { primary: ['dorsaux'], secondary: ['trapezes', 'biceps', 'lombaires'] },
  'rowing-barre': { primary: ['dorsaux'], secondary: ['trapezes', 'biceps', 'lombaires'] },
  'rowing-haltere': { primary: ['dorsaux'], secondary: ['trapezes', 'biceps'] },
  shrugs: { primary: ['trapezes'], secondary: [] },
  oiseau: { primary: ['deltoides'], secondary: ['trapezes', 'dorsaux'] },
  'elevations-laterales': { primary: ['deltoides'], secondary: ['trapezes'] },
  'elevations-frontales': { primary: ['deltoides'], secondary: ['pectoraux'] },
  'curl-biceps': { primary: ['biceps'], secondary: [] },
  'extension-triceps': { primary: ['triceps'], secondary: [] },
  'extension-triceps-poulie': { primary: ['triceps'], secondary: [] },
  gainage: { primary: ['abdominaux'], secondary: ['lombaires'] },
  planche: { primary: ['abdominaux'], secondary: ['lombaires'] },
  crunch: { primary: ['abdominaux'], secondary: [] },
  'releve-de-jambes': { primary: ['abdominaux'], secondary: [] },
  'adducteurs-machine': { primary: ['adducteurs'], secondary: [] },
  'abducteurs-machine': { primary: ['abducteurs'], secondary: ['fessiers'] },
}

const EMPTY_MUSCLES = { primary: [], secondary: [] }

export function getExerciseMuscles(exerciseName) {
  return EXERCISE_MUSCLES[slugify(exerciseName)] ?? EMPTY_MUSCLES
}
