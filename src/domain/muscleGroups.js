import { slugify } from '../lib/slugify.js'

// Liste des groupes musculaires suivis par l'app, dans l'ordre où ils
// doivent apparaître dans les listes (récupération, muscles négligés,
// filtre du sélecteur d'exercice). Inclut avant-bras, brachial et obliques
// en plus des 14 groupes "principaux" d'origine, pour rester fidèle à la
// base d'exercices fournie (exercices-musculation.md) qui les distingue.
// Deux muscles très ponctuels de cette base (fléchisseurs de hanche,
// tibial antérieur - une seule mention chacun) sont repliés respectivement
// sur abdominaux et mollets plutôt que d'ajouter deux groupes de plus pour
// un seul exercice chacun.
export const MUSCLE_GROUPS = [
  'pectoraux',
  'dorsaux',
  'trapezes',
  'deltoides',
  'biceps',
  'triceps',
  'avant-bras',
  'brachial',
  'abdominaux',
  'obliques',
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
  'avant-bras': 'Avant-bras',
  brachial: 'Brachial',
  abdominaux: 'Abdominaux',
  obliques: 'Obliques',
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

// Base d'exercices fournie par l'utilisateur (exercices-musculation.md,
// ~130 exercices classés par groupe musculaire avec muscle principal /
// muscles secondaires). Clé = nom d'exercice slugifié, "name" = libellé
// affiché tel quel (sert aussi à peupler le catalogue, voir
// domain/exercises.js#seedDefaultExercises). Un exercice listé dans
// plusieurs sections de la source (polyarticulaires) est fusionné en une
// seule entrée avec plusieurs muscles principaux plutôt que dupliqué.
export const EXERCISE_MUSCLES = {
  // Pectoraux
  'developpe-couche-barre': { name: 'Développé couché barre', primary: ['pectoraux'], secondary: ['triceps', 'deltoides'] },
  'developpe-couche-halteres': { name: 'Développé couché haltères', primary: ['pectoraux'], secondary: ['triceps', 'deltoides'] },
  'developpe-incline-barre': { name: 'Développé incliné barre', primary: ['pectoraux'], secondary: ['deltoides', 'triceps'] },
  'developpe-incline-halteres': { name: 'Développé incliné haltères', primary: ['pectoraux'], secondary: ['deltoides', 'triceps'] },
  'developpe-decline-barre': { name: 'Développé décliné barre', primary: ['pectoraux'], secondary: ['triceps'] },
  'developpe-a-la-machine-convergente': { name: 'Développé à la machine convergente', primary: ['pectoraux'], secondary: ['triceps', 'deltoides'] },
  'ecarte-couche-halteres': { name: 'Écarté couché haltères', primary: ['pectoraux'], secondary: ['deltoides'] },
  'ecarte-incline-halteres': { name: 'Écarté incliné haltères', primary: ['pectoraux'], secondary: ['deltoides'] },
  'ecarte-a-la-poulie-vis-a-vis': { name: 'Écarté à la poulie vis-à-vis', primary: ['pectoraux'], secondary: ['deltoides'] },
  'pec-deck-butterfly': { name: 'Pec deck (butterfly)', primary: ['pectoraux'], secondary: ['deltoides'] },
  pompes: { name: 'Pompes', primary: ['pectoraux'], secondary: ['triceps', 'deltoides', 'abdominaux'] },
  'pompes-declinees': { name: 'Pompes déclinées', primary: ['pectoraux'], secondary: ['triceps', 'deltoides'] },
  'pompes-diamant': { name: 'Pompes diamant', primary: ['triceps'], secondary: ['pectoraux', 'deltoides'] },
  'dips-sur-barres-paralleles-buste-penche': { name: 'Dips sur barres parallèles (buste penché)', primary: ['pectoraux'], secondary: ['triceps', 'deltoides'] },
  'pull-over-haltere': { name: 'Pull-over haltère', primary: ['pectoraux'], secondary: ['dorsaux', 'triceps'] },

  // Dorsaux
  'tractions-pronation': { name: 'Tractions pronation', primary: ['dorsaux'], secondary: ['biceps', 'trapezes', 'avant-bras'] },
  'tractions-supination': { name: 'Tractions supination', primary: ['dorsaux'], secondary: ['biceps', 'avant-bras'] },
  'tractions-prise-neutre': { name: 'Tractions prise neutre', primary: ['dorsaux'], secondary: ['biceps', 'avant-bras'] },
  'tractions-prise-serree': { name: 'Tractions prise serrée', primary: ['dorsaux'], secondary: ['biceps', 'avant-bras'] },
  'tirage-vertical-poulie-haute-pronation': { name: 'Tirage vertical poulie haute (pronation)', primary: ['dorsaux'], secondary: ['biceps', 'trapezes'] },
  'tirage-vertical-poulie-haute-supination': { name: 'Tirage vertical poulie haute (supination)', primary: ['dorsaux'], secondary: ['biceps'] },
  'tirage-vertical-prise-neutre': { name: 'Tirage vertical prise neutre', primary: ['dorsaux'], secondary: ['biceps'] },
  'tirage-horizontal-poulie-basse': { name: 'Tirage horizontal poulie basse', primary: ['dorsaux'], secondary: ['trapezes', 'biceps', 'lombaires'] },
  'rowing-barre-buste-penche': { name: 'Rowing barre buste penché', primary: ['dorsaux'], secondary: ['trapezes', 'biceps', 'lombaires'] },
  'rowing-haltere-unilateral': { name: 'Rowing haltère unilatéral', primary: ['dorsaux'], secondary: ['trapezes', 'biceps'] },
  'rowing-t-bar': { name: 'Rowing T-bar', primary: ['dorsaux'], secondary: ['trapezes', 'biceps'] },
  'rowing-a-la-machine-assis': { name: 'Rowing à la machine assis', primary: ['dorsaux'], secondary: ['trapezes', 'biceps'] },
  'pull-over-a-la-poulie-haute-bras-tendus': { name: 'Pull-over à la poulie haute (bras tendus)', primary: ['dorsaux'], secondary: ['triceps', 'abdominaux'] },
  'face-pull': { name: 'Face pull', primary: ['trapezes'], secondary: ['deltoides', 'dorsaux'] },

  // Trapèzes
  'shrugs-barre': { name: 'Shrugs barre', primary: ['trapezes'], secondary: ['avant-bras'] },
  'shrugs-halteres': { name: 'Shrugs haltères', primary: ['trapezes'], secondary: ['avant-bras'] },
  'shrugs-a-la-barre-guidee': { name: 'Shrugs à la barre guidée', primary: ['trapezes'], secondary: ['avant-bras'] },
  'tirage-menton-rowing-vertical': { name: 'Tirage menton (rowing vertical)', primary: ['trapezes'], secondary: ['deltoides', 'biceps'] },
  'face-pull-a-la-corde': { name: 'Face pull à la corde', primary: ['trapezes'], secondary: ['deltoides'] },
  'farmers-walk': { name: "Farmer's walk", primary: ['trapezes', 'avant-bras'], secondary: ['abdominaux', 'quadriceps'] },

  // Deltoïdes
  'developpe-militaire-barre-debout': { name: 'Développé militaire barre debout', primary: ['deltoides'], secondary: ['triceps', 'trapezes'] },
  'developpe-militaire-assis-barre': { name: 'Développé militaire assis barre', primary: ['deltoides'], secondary: ['triceps'] },
  'developpe-halteres-assis': { name: 'Développé haltères assis', primary: ['deltoides'], secondary: ['triceps'] },
  'developpe-arnold': { name: 'Développé Arnold', primary: ['deltoides'], secondary: ['triceps'] },
  'developpe-epaules-a-la-machine': { name: 'Développé épaules à la machine', primary: ['deltoides'], secondary: ['triceps'] },
  'elevations-laterales-halteres': { name: 'Élévations latérales haltères', primary: ['deltoides'], secondary: ['trapezes'] },
  'elevations-laterales-a-la-poulie': { name: 'Élévations latérales à la poulie', primary: ['deltoides'], secondary: ['trapezes'] },
  'elevations-frontales-halteres': { name: 'Élévations frontales haltères', primary: ['deltoides'], secondary: ['pectoraux'] },
  'elevations-frontales-barre': { name: 'Élévations frontales barre', primary: ['deltoides'], secondary: ['pectoraux'] },
  'oiseau-halteres-buste-penche': { name: 'Oiseau haltères (buste penché)', primary: ['deltoides'], secondary: ['trapezes', 'dorsaux'] },
  'oiseau-a-la-poulie-vis-a-vis': { name: 'Oiseau à la poulie vis-à-vis', primary: ['deltoides'], secondary: ['trapezes'] },
  'reverse-pec-deck': { name: 'Reverse pec deck', primary: ['deltoides'], secondary: ['trapezes'] },

  // Biceps
  'curl-barre-droite': { name: 'Curl barre droite', primary: ['biceps'], secondary: ['avant-bras'] },
  'curl-barre-ez': { name: 'Curl barre EZ', primary: ['biceps'], secondary: ['avant-bras'] },
  'curl-halteres-alternes': { name: 'Curl haltères alternés', primary: ['biceps'], secondary: ['avant-bras'] },
  'curl-halteres-simultanes': { name: 'Curl haltères simultanés', primary: ['biceps'], secondary: ['avant-bras'] },
  'curl-marteau': { name: 'Curl marteau', primary: ['biceps', 'brachial'], secondary: ['avant-bras'] },
  'curl-incline-halteres': { name: 'Curl incliné haltères', primary: ['biceps'], secondary: ['avant-bras'] },
  'curl-pupitre-larry-scott': { name: 'Curl pupitre (Larry Scott)', primary: ['biceps'], secondary: ['avant-bras'] },
  'curl-a-la-poulie-basse': { name: 'Curl à la poulie basse', primary: ['biceps'], secondary: ['avant-bras'] },
  'curl-a-la-machine': { name: 'Curl à la machine', primary: ['biceps'], secondary: ['avant-bras'] },
  'curl-concentre': { name: 'Curl concentré', primary: ['biceps'], secondary: ['avant-bras'] },
  'curl-araignee-spider-curl': { name: 'Curl araignée (spider curl)', primary: ['biceps'], secondary: ['avant-bras'] },

  // Triceps
  'extension-triceps-a-la-poulie-haute-barre': { name: 'Extension triceps à la poulie haute (barre)', primary: ['triceps'], secondary: [] },
  'extension-triceps-a-la-poulie-haute-corde': { name: 'Extension triceps à la poulie haute (corde)', primary: ['triceps'], secondary: [] },
  'extension-triceps-a-la-poulie-prise-inversee': { name: 'Extension triceps à la poulie (prise inversée)', primary: ['triceps'], secondary: [] },
  'barre-au-front-skull-crusher': { name: 'Barre au front (skull crusher)', primary: ['triceps'], secondary: [] },
  'extension-nuque-haltere': { name: 'Extension nuque haltère', primary: ['triceps'], secondary: [] },
  'extension-nuque-a-la-poulie': { name: 'Extension nuque à la poulie', primary: ['triceps'], secondary: [] },
  'kickback-haltere': { name: 'Kickback haltère', primary: ['triceps'], secondary: [] },
  'dips-machine': { name: 'Dips machine', primary: ['triceps'], secondary: ['pectoraux', 'deltoides'] },
  'dips-sur-barres-paralleles-buste-droit': { name: 'Dips sur barres parallèles (buste droit)', primary: ['triceps'], secondary: ['pectoraux', 'deltoides'] },
  'dips-sur-banc': { name: 'Dips sur banc', primary: ['triceps'], secondary: ['deltoides'] },
  'developpe-couche-prise-serree': { name: 'Développé couché prise serrée', primary: ['triceps'], secondary: ['pectoraux', 'deltoides'] },

  // Avant-bras
  'curl-poignets-barre-flexion': { name: 'Curl poignets barre (flexion)', primary: ['avant-bras'], secondary: [] },
  'curl-poignets-inverse-extension': { name: 'Curl poignets inversé (extension)', primary: ['avant-bras'], secondary: [] },
  'suspension-a-la-barre-dead-hang': { name: 'Suspension à la barre (dead hang)', primary: ['avant-bras'], secondary: ['dorsaux'] },

  // Abdominaux
  'crunch-au-sol': { name: 'Crunch au sol', primary: ['abdominaux'], secondary: [] },
  'crunch-a-la-poulie-haute': { name: 'Crunch à la poulie haute', primary: ['abdominaux'], secondary: [] },
  'crunch-a-la-machine': { name: 'Crunch à la machine', primary: ['abdominaux'], secondary: [] },
  'releve-de-jambes-suspendu': { name: 'Relevé de jambes suspendu', primary: ['abdominaux'], secondary: [] },
  'releve-de-genoux-suspendu': { name: 'Relevé de genoux suspendu', primary: ['abdominaux'], secondary: [] },
  'releve-de-jambes-au-sol': { name: 'Relevé de jambes au sol', primary: ['abdominaux'], secondary: [] },
  'gainage-planche': { name: 'Gainage planche', primary: ['abdominaux'], secondary: ['lombaires', 'deltoides'] },
  'gainage-lateral': { name: 'Gainage latéral', primary: ['obliques'], secondary: ['abdominaux'] },
  'russian-twist': { name: 'Russian twist', primary: ['obliques'], secondary: ['abdominaux'] },
  'rotations-a-la-poulie-wood-chop': { name: 'Rotations à la poulie (wood chop)', primary: ['obliques'], secondary: ['abdominaux'] },
  'roulette-abdominale-ab-wheel': { name: 'Roulette abdominale (ab wheel)', primary: ['abdominaux'], secondary: ['lombaires', 'dorsaux'] },
  'mountain-climbers': { name: 'Mountain climbers', primary: ['abdominaux'], secondary: ['deltoides', 'quadriceps'] },
  'sit-up': { name: 'Sit-up', primary: ['abdominaux'], secondary: [] },

  // Lombaires
  'extension-lombaire-au-banc': { name: 'Extension lombaire au banc', primary: ['lombaires'], secondary: ['fessiers', 'ischio-jambiers'] },
  'extension-lombaire-a-la-machine': { name: 'Extension lombaire à la machine', primary: ['lombaires'], secondary: [] },
  'good-morning-barre': { name: 'Good morning barre', primary: ['lombaires', 'ischio-jambiers'], secondary: ['fessiers'] },
  'souleve-de-terre-jambes-tendues': { name: 'Soulevé de terre jambes tendues', primary: ['ischio-jambiers'], secondary: ['lombaires', 'fessiers'] },
  'superman-au-sol': { name: 'Superman au sol', primary: ['lombaires'], secondary: ['fessiers'] },
  'hip-thrust': { name: 'Hip thrust', primary: ['fessiers'], secondary: ['ischio-jambiers', 'lombaires'] },

  // Quadriceps
  'squat-barre-nuque': { name: 'Squat barre (nuque)', primary: ['quadriceps'], secondary: ['fessiers', 'lombaires', 'ischio-jambiers'] },
  'front-squat': { name: 'Front squat', primary: ['quadriceps'], secondary: ['fessiers', 'abdominaux'] },
  'squat-a-la-barre-guidee-smith-machine': { name: 'Squat à la barre guidée (Smith machine)', primary: ['quadriceps'], secondary: ['fessiers'] },
  'goblet-squat': { name: 'Goblet squat', primary: ['quadriceps'], secondary: ['fessiers', 'abdominaux'] },
  'presse-a-cuisses': { name: 'Presse à cuisses', primary: ['quadriceps'], secondary: ['fessiers', 'ischio-jambiers'] },
  'hack-squat': { name: 'Hack squat', primary: ['quadriceps'], secondary: ['fessiers'] },
  'leg-extension': { name: 'Leg extension', primary: ['quadriceps'], secondary: [] },
  'fentes-avant': { name: 'Fentes avant', primary: ['quadriceps'], secondary: ['fessiers', 'ischio-jambiers'] },
  'fentes-marchees': { name: 'Fentes marchées', primary: ['quadriceps'], secondary: ['fessiers', 'ischio-jambiers'] },
  'fentes-bulgares': { name: 'Fentes bulgares', primary: ['quadriceps', 'fessiers'], secondary: [] },
  'step-up-sur-banc': { name: 'Step-up sur banc', primary: ['quadriceps'], secondary: ['fessiers'] },
  'sissy-squat': { name: 'Sissy squat', primary: ['quadriceps'], secondary: [] },

  // Ischio-jambiers
  'leg-curl-allonge': { name: 'Leg curl allongé', primary: ['ischio-jambiers'], secondary: ['mollets'] },
  'leg-curl-assis': { name: 'Leg curl assis', primary: ['ischio-jambiers'], secondary: [] },
  'leg-curl-debout-unilateral': { name: 'Leg curl debout (unilatéral)', primary: ['ischio-jambiers'], secondary: [] },
  'souleve-de-terre-roumain': { name: 'Soulevé de terre roumain', primary: ['ischio-jambiers'], secondary: ['fessiers', 'lombaires'] },
  'nordic-curl': { name: 'Nordic curl', primary: ['ischio-jambiers'], secondary: ['fessiers'] },

  // Fessiers
  'hip-thrust-barre': { name: 'Hip thrust barre', primary: ['fessiers'], secondary: ['ischio-jambiers', 'quadriceps'] },
  'pont-fessier-au-sol': { name: 'Pont fessier au sol', primary: ['fessiers'], secondary: ['ischio-jambiers'] },
  'kickback-fessier-a-la-poulie': { name: 'Kickback fessier à la poulie', primary: ['fessiers'], secondary: ['ischio-jambiers'] },
  'abduction-hanche-a-la-machine': { name: 'Abduction hanche à la machine', primary: ['fessiers'], secondary: ['abducteurs'] },
  'squat-sumo': { name: 'Squat sumo', primary: ['fessiers', 'adducteurs'], secondary: ['quadriceps'] },
  'souleve-de-terre-sumo': { name: 'Soulevé de terre sumo', primary: ['fessiers'], secondary: ['quadriceps', 'lombaires', 'ischio-jambiers'] },
  'montee-de-banc-lestee': { name: 'Montée de banc lestée', primary: ['fessiers'], secondary: ['quadriceps'] },

  // Mollets
  'extension-mollets-debout-a-la-machine': { name: 'Extension mollets debout à la machine', primary: ['mollets'], secondary: [] },
  'extension-mollets-assis': { name: 'Extension mollets assis', primary: ['mollets'], secondary: [] },
  'extension-mollets-a-la-presse': { name: 'Extension mollets à la presse', primary: ['mollets'], secondary: [] },
  'extension-mollets-barre-guidee': { name: 'Extension mollets barre guidée', primary: ['mollets'], secondary: [] },
  'extension-mollets-un-pied-au-poids-du-corps': { name: 'Extension mollets un pied (au poids du corps)', primary: ['mollets'], secondary: [] },
  'marche-sur-la-pointe-des-pieds': { name: 'Marche sur la pointe des pieds', primary: ['mollets'], secondary: [] },
  'marche-sur-les-talons': { name: 'Marche sur les talons', primary: ['mollets'], secondary: [] },

  // Adducteurs et abducteurs
  'machine-adducteurs-serrer': { name: 'Machine adducteurs (serrer)', primary: ['adducteurs'], secondary: [] },
  'machine-abducteurs-ecarter': { name: 'Machine abducteurs (écarter)', primary: ['abducteurs'], secondary: ['fessiers'] },
  'adduction-a-la-poulie-basse': { name: 'Adduction à la poulie basse', primary: ['adducteurs'], secondary: [] },
  'abduction-a-la-poulie-basse': { name: 'Abduction à la poulie basse', primary: ['abducteurs'], secondary: ['fessiers'] },
  'fente-laterale': { name: 'Fente latérale', primary: ['adducteurs'], secondary: ['quadriceps', 'fessiers'] },
  'marche-laterale-avec-elastique': { name: 'Marche latérale avec élastique', primary: ['abducteurs'], secondary: ['fessiers'] },

  // Exercices polyarticulaires (noms génériques, distincts des variantes ci-dessus)
  'souleve-de-terre': {
    name: 'Soulevé de terre',
    primary: ['dorsaux', 'lombaires', 'fessiers', 'ischio-jambiers'],
    secondary: ['trapezes', 'quadriceps', 'avant-bras'],
  },
  'squat-barre': { name: 'Squat barre', primary: ['quadriceps', 'fessiers'], secondary: ['lombaires', 'ischio-jambiers', 'abdominaux'] },
  'developpe-couche': { name: 'Développé couché', primary: ['pectoraux'], secondary: ['triceps', 'deltoides'] },
  tractions: { name: 'Tractions', primary: ['dorsaux'], secondary: ['biceps', 'trapezes', 'avant-bras'] },
  'developpe-militaire': { name: 'Développé militaire', primary: ['deltoides'], secondary: ['triceps', 'trapezes', 'abdominaux'] },
  dips: { name: 'Dips', primary: ['pectoraux', 'triceps'], secondary: ['deltoides'] },
  'clean-and-press': { name: 'Clean and press', primary: ['deltoides', 'quadriceps', 'fessiers'], secondary: ['trapezes', 'lombaires', 'triceps'] },
  thruster: { name: 'Thruster', primary: ['quadriceps', 'deltoides'], secondary: ['fessiers', 'triceps'] },
  burpees: { name: 'Burpees', primary: ['quadriceps', 'pectoraux'], secondary: ['abdominaux', 'deltoides', 'triceps'] },
  'kettlebell-swing': { name: 'Kettlebell swing', primary: ['fessiers', 'ischio-jambiers'], secondary: ['lombaires', 'deltoides', 'abdominaux'] },

  // Cardio (pas de groupe musculaire de musculation ciblé : primary/secondary
  // vides plutôt qu'un 18e groupe rien que pour lui, voir MUSCLE_GROUPS).
  rameur: { name: 'Rameur', primary: [], secondary: [] },
}

// Alias : noms courts/génériques que l'utilisateur est susceptible d'avoir
// déjà saisis, ne correspondant à aucune clé exacte ci-dessus. Pointent
// vers l'entrée la plus proche pour la RECHERCHE de muscles uniquement -
// contrairement à EXERCISE_MUSCLES, ces clés ne sont jamais semées comme
// exercices du catalogue (elles feraient doublon avec l'entrée qu'elles
// visent).
const EXERCISE_ALIASES = {
  squat: 'squat-barre',
  'squat-bulgare': 'fentes-bulgares',
  fentes: 'fentes-avant',
  'leg-curl': 'leg-curl-allonge',
  'mollets-debout': 'extension-mollets-debout-a-la-machine',
  'mollets-assis': 'extension-mollets-assis',
  'tirage-vertical': 'tirage-vertical-poulie-haute-pronation',
  'tirage-horizontal': 'tirage-horizontal-poulie-basse',
  'rowing-barre': 'rowing-barre-buste-penche',
  'rowing-haltere': 'rowing-haltere-unilateral',
  shrugs: 'shrugs-barre',
  oiseau: 'oiseau-halteres-buste-penche',
  'elevations-laterales': 'elevations-laterales-halteres',
  'elevations-frontales': 'elevations-frontales-halteres',
  'curl-biceps': 'curl-barre-droite',
  'extension-triceps': 'extension-triceps-a-la-poulie-haute-barre',
  'extension-triceps-poulie': 'extension-triceps-a-la-poulie-haute-barre',
  gainage: 'gainage-planche',
  planche: 'gainage-planche',
  crunch: 'crunch-au-sol',
  'releve-de-jambes': 'releve-de-jambes-au-sol',
  'adducteurs-machine': 'machine-adducteurs-serrer',
  'abducteurs-machine': 'machine-abducteurs-ecarter',
  'curl-poignets': 'curl-poignets-barre-flexion',
  'dead-hang': 'suspension-a-la-barre-dead-hang',
}

const EMPTY_MUSCLES = { primary: [], secondary: [] }

// Clé canonique (dans EXERCISE_MUSCLES) correspondant à un nom d'exercice,
// en résolvant d'abord une correspondance exacte puis un alias. Sert à la
// fois à retrouver les muscles d'un exercice et à savoir, côté semis du
// catalogue, si un exercice existant "couvre" déjà une entrée canonique
// même sous un nom différent (ex. le "Gainage" de l'utilisateur couvre la
// même clé que notre "Gainage planche" via l'alias gainage -> gainage-planche).
function resolveExerciseKey(exerciseName) {
  const slug = slugify(exerciseName)
  if (EXERCISE_MUSCLES[slug]) return slug
  return EXERCISE_ALIASES[slug] ?? null
}

export function getExerciseMuscles(exerciseName) {
  const key = resolveExerciseKey(exerciseName)
  if (!key) return EMPTY_MUSCLES
  const { primary, secondary } = EXERCISE_MUSCLES[key]
  return { primary, secondary }
}

// Exercices mesurés en durée (secondes tenues) plutôt qu'en nombre de
// répétitions : gainage, suspension, marches... Résolu par clé canonique
// (comme les alias ci-dessus) pour couvrir aussi les noms équivalents
// saisis par l'utilisateur (ex. "Gainage" -> gainage-planche).
const TIME_BASED_EXERCISE_KEYS = new Set([
  'gainage-planche',
  'gainage-lateral',
  'suspension-a-la-barre-dead-hang',
  'marche-sur-la-pointe-des-pieds',
  'marche-sur-les-talons',
  'marche-laterale-avec-elastique',
  'rameur',
])

export function getExerciseUnit(exerciseName) {
  const key = resolveExerciseKey(exerciseName)
  return key != null && TIME_BASED_EXERCISE_KEYS.has(key) ? 'time' : 'reps'
}

// {key, name} de toutes les entrées "canoniques" (hors alias) : sert à
// peupler le catalogue d'exercices, voir
// domain/exercises.js#seedDefaultExercises.
export function getSeedExercises() {
  return Object.entries(EXERCISE_MUSCLES).map(([key, entry]) => ({ key, name: entry.name }))
}

// Exposé pour le semis (voir domain/exercises.js#seedDefaultExercises) : ne
// pas semer une entrée canonique déjà couverte par un exercice existant,
// même sous un autre nom.
export function resolveExerciseCanonicalKey(exerciseName) {
  return resolveExerciseKey(exerciseName)
}
