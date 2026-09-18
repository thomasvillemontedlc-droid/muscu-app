import { getExerciseMuscles, getSeedExercises } from './muscleGroups.js'
import { getOrCreateExercise } from './exercises.js'
import { TEMPLATE_STRUCTURES } from './templateModels.js'

// Ensemble des muscles principaux d'un exercice, comme clé de comparaison
// (triée pour que l'ordre n'ait pas d'importance). Chaîne vide si l'exercice
// n'a pas de muscle détecté (nom hors base, voir domain/muscleGroups.js) :
// on ne propose alors aucun remplacement plutôt qu'un mauvais.
function getPrimaryMuscleKey(name) {
  return [...getExerciseMuscles(name).primary].sort().join(',')
}

// Muscles principaux touchés par une séance entière (union sur tous ses
// exercices), comme clé de comparaison — sert à repérer une "variante" de
// séance (même ciblage musculaire global), pas exercice par exercice.
function getSessionMuscleKey(exerciseNames) {
  const muscles = new Set()
  for (const name of exerciseNames) {
    for (const muscle of getExerciseMuscles(name).primary) muscles.add(muscle)
  }
  return [...muscles].sort().join(',')
}

function sameExerciseSet(namesA, namesB) {
  if (namesA.length !== namesB.length) return false
  const setB = new Set(namesB)
  return namesA.every((name) => setB.has(name))
}

// Modèles prédéfinis (voir domain/templateModels.js), dédoublonnés par nom :
// certains modèles sont partagés entre deux structures (ex. "Modèle Pecs"
// entre la Structure B et la Structure E), il ne faut pas les proposer deux
// fois comme variante.
function getAllModelsOnce() {
  const byName = new Map()
  for (const structure of TEMPLATE_STRUCTURES) {
    for (const model of structure.models) {
      if (!byName.has(model.name)) byName.set(model.name, model)
    }
  }
  return [...byName.values()]
}

// Variantes "prêtes à l'emploi" pour une séance : les modèles prédéfinis
// ciblant exactement les mêmes groupes musculaires principaux que la
// séance actuelle (ex. Push A <-> Push B), à l'exclusion de la séance
// elle-même si elle correspond à l'un de ces modèles. Générique — ne
// connaît aucune paire A/B en dur, seulement le ciblage musculaire commun,
// donc couvre aussi bien les structures par fréquence que PPL/split.
export function getVariantModelOptions(currentExerciseNames) {
  const currentKey = getSessionMuscleKey(currentExerciseNames)
  if (!currentKey) return []

  return getAllModelsOnce()
    .filter((model) => {
      const modelNames = model.exercises.map((e) => e.name)
      if (sameExerciseSet(modelNames, currentExerciseNames)) return false
      return getSessionMuscleKey(modelNames) === currentKey
    })
    .map((model) => ({ label: model.name, exerciseNames: model.exercises.map((e) => e.name) }))
}

// Choisit un remplaçant pour un exercice : mêmes muscles principaux,
// différent de l'exercice actuel et de ceux déjà retenus dans cette même
// proposition (pour ne pas dupliquer un remplacement au sein d'une même
// séance). Puisé dans la base fournie (exercices-musculation.md, voir
// getSeedExercises) plutôt que le seul catalogue personnel, pour avoir
// plus de choix que les seuls exercices déjà utilisés. Repli sur l'exercice
// actuel si aucun candidat n'existe (muscle trop spécifique, ou exercice
// hors base) : un bloc n'est jamais laissé sans exercice.
function pickReplacement(currentName, excludeNames) {
  const targetKey = getPrimaryMuscleKey(currentName)
  if (!targetKey) return currentName

  const candidates = getSeedExercises()
    .map((e) => e.name)
    .filter((name) => !excludeNames.has(name) && getPrimaryMuscleKey(name) === targetKey)

  if (candidates.length === 0) return currentName
  return candidates[Math.floor(Math.random() * candidates.length)]
}

// Génère une suggestion exercice par exercice (ancien comportement, gardé
// comme repli) : utilisée uniquement quand aucun modèle prédéfini ne cible
// les mêmes groupes musculaires que la séance (ex. une séance créée à la
// main, ou un ciblage trop spécifique pour correspondre à un modèle).
function buildFallbackOption(currentNames) {
  const excludeNames = new Set(currentNames)
  const exerciseNames = currentNames.map((name) => {
    const replacement = pickReplacement(name, excludeNames)
    excludeNames.add(replacement)
    return replacement
  })
  return { label: 'Nouvelle sélection suggérée', exerciseNames }
}

// Propose, pour chaque séance du programme, la liste des variantes
// disponibles (voir getVariantModelOptions) — ou à défaut une suggestion
// générée exercice par exercice — parmi lesquelles choisir, en plus de la
// possibilité de garder la séance telle quelle. Ne modifie rien : c'est
// une proposition à valider (voir applyRotationProposal et
// ProgramPage.jsx) — jamais appliquée seule, ni même partiellement : le
// choix se fait séance par séance côté UI avant application.
export function proposeRotation(program, templates, exercises) {
  return program.templateIds
    .map((templateId) => templates.find((t) => t.id === templateId))
    .filter(Boolean)
    .map((template) => {
      const currentNames = template.exerciseIds
        .map((id) => exercises.find((e) => e.id === id)?.name)
        .filter(Boolean)

      const variantOptions = getVariantModelOptions(currentNames)
      const options = variantOptions.length > 0 ? variantOptions : [buildFallbackOption(currentNames)]

      return { templateId: template.id, templateName: template.name, currentNames, options }
    })
}

// Applique la variante choisie pour une séance : crée/retrouve chaque
// exercice dans le catalogue (comme un ajout manuel, voir
// domain/exercises.js#getOrCreateExercise), puis remplace la liste
// d'exercices du template EN PLACE — même id, même nom de séance.
// L'historique de chaque exercice (ancien comme nouveau) reste intact et
// consultable : il vit dans les séances déjà faites (domain/history.js),
// indépendamment de ce que le template référence maintenant. Un exercice
// qui revient dans un bloc ultérieur retrouve donc directement son
// historique, puisque getOrCreateExercise réutilise la même entrée du
// catalogue pour un nom identique.
export function applyRotationProposal(templates, exercises, templateId, proposedNames) {
  let currentExercises = exercises
  const exerciseIds = []

  for (const name of proposedNames) {
    const { exercise, exercises: updated } = getOrCreateExercise(currentExercises, name)
    currentExercises = updated
    exerciseIds.push(exercise.id)
  }

  const updatedTemplates = templates.map((t) =>
    t.id === templateId ? { ...t, exerciseIds, updatedAt: new Date().toISOString() } : t,
  )

  return { templates: updatedTemplates, exercises: currentExercises }
}
