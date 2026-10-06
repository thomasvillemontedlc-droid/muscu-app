import { createId } from '../storage/ids.js'
import { slugify } from '../lib/slugify.js'
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

// Tout exercice dont le nom contient "poulie" : on y mémorise le cran
// (pulleyNotch, entier).
export function isPulleyExercise(name) {
  return slugify(name ?? '').includes('poulie')
}

// Poulie réglable en HAUTEUR : seulement les vis-à-vis (écarté/oiseau
// vis-à-vis...), où la hauteur varie réellement d'une fois sur l'autre. Les
// "poulie haute"/"poulie basse" (tirages, extensions triceps, curl...) ont
// une position fixe déjà encodée dans leur nom.
export function isPulleyHeightExercise(name) {
  return isPulleyExercise(name) && slugify(name ?? '').includes('vis-a-vis')
}

export const PULLEY_HEIGHTS = ['Haute', 'Moyenne', 'Basse']

// Hauteur de poulie ('Haute' | 'Moyenne' | 'Basse' | null) et cran (entier
// | null), mémorisés par exercice comme barWeight/weightStep, voir
// components/WeightField.jsx pour la saisie.
export function setExercisePulleyHeight(exercises, exerciseId, pulleyHeight) {
  return exercises.map((e) => (e.id === exerciseId ? { ...e, pulleyHeight } : e))
}

export function setExercisePulleyNotch(exercises, exerciseId, pulleyNotch) {
  return exercises.map((e) => (e.id === exerciseId ? { ...e, pulleyNotch } : e))
}

// Ancien réglage unique pulleyLevel (texte libre) -> pulleyHeight si c'était
// une des 3 hauteurs, pulleyNotch si c'était un nombre entier, ignoré
// sinon. Voir storage/storage.js (migration v5 -> v6).
export function migratePulleyLevel(exercise) {
  if (!('pulleyLevel' in exercise)) return exercise
  const { pulleyLevel, ...rest } = exercise
  const text = String(pulleyLevel ?? '').trim()
  const height = PULLEY_HEIGHTS.find((h) => h.toLowerCase() === text.toLowerCase())
  if (height) return { ...rest, pulleyHeight: height }
  if (/^\d+$/.test(text)) return { ...rest, pulleyNotch: Number(text) }
  return rest
}

// "Poulie haute · cran 7" (ou l'un des deux seulement), null si rien n'est
// mémorisé - rappel affiché avec la dernière performance.
export function getPulleySummary(exercise) {
  if (!exercise || !isPulleyExercise(exercise.name)) return null
  const parts = []
  if (exercise.pulleyHeight && isPulleyHeightExercise(exercise.name)) {
    parts.push(`Poulie ${exercise.pulleyHeight.toLowerCase()}`)
  }
  if (exercise.pulleyNotch != null) parts.push(`${parts.length ? 'cran' : 'Cran'} ${exercise.pulleyNotch}`)
  return parts.length ? parts.join(' · ') : null
}

// Largeur de prise (tirages horizontal/vertical et variantes), même
// principe que pulleyHeight ci-dessus mais pour un réglage qui varie par
// largeur de prise plutôt que par hauteur de poulie - voir
// components/WeightField.jsx#isGripWidthExercise.
export function setExerciseGripWidth(exercises, exerciseId, gripWidth) {
  return exercises.map((e) => (e.id === exerciseId ? { ...e, gripWidth } : e))
}

// Exercice fait un côté après l'autre (droit/gauche séparément), mémorisé
// par exercice comme les autres réglages de saisie ci-dessus. Affecte la
// FORME des séries de la séance (doublées en paires droit/gauche, voir
// domain/sessions.js#setEntryUnilateral et la doc de domain/sessionRunner.js
// sur ce champ) - distinct de weightInputMode 'perSide' ci-dessus, qui lui
// ne change que la façon de saisir un seul poids pour un mouvement fait des
// deux côtés EN MÊME TEMPS (barre, haltères, poulies vis-à-vis).
export function setExerciseUnilateral(exercises, exerciseId, unilateral) {
  return exercises.map((e) => (e.id === exerciseId ? { ...e, unilateral } : e))
}

// Pas d'incrément des boutons +/- de charge, mémorisé par exercice (voir
// getEffectiveWeightStep ci-dessous pour la valeur par défaut tant que rien
// n'est mémorisé ici).
export function setExerciseWeightStep(exercises, exerciseId, weightStep) {
  return exercises.map((e) => (e.id === exerciseId ? { ...e, weightStep } : e))
}

// Pas d'incrément par défaut des boutons +/- de charge, avant tout réglage
// mémorisé sur l'exercice : 1,25kg pour une barre (petits disques), 1kg
// pour une poulie ou des haltères, dont les paliers disponibles sont plus
// fins.
function getDefaultWeightStep(name) {
  const slug = slugify(name ?? '')
  if (slug.includes('poulie') || slug.includes('haltere')) return 1
  return 1.25
}

// Pas d'incrément effectif d'un exercice (réglage mémorisé sur l'exercice,
// sinon le défaut ci-dessus) : source commune à components/WeightField.jsx
// (boutons +/-) et domain/chargeSuggestion.js (montant de la hausse
// proposée), pour ne jamais désaccorder les deux.
export function getEffectiveWeightStep(exercise) {
  return exercise?.weightStep ?? getDefaultWeightStep(exercise?.name)
}
