import { getExerciseMuscles } from './muscleGroups.js'
import { TEMPLATE_STRUCTURES } from './templateModels.js'

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

// Modèles prédéfinis ciblant exactement les mêmes groupes musculaires
// principaux qu'une séance donnée (ex. Push A <-> Push B), à l'exclusion de
// la séance elle-même si elle correspond à l'un de ces modèles. Générique —
// ne connaît aucune paire A/B en dur, seulement le ciblage musculaire
// commun, donc couvre aussi bien les structures par fréquence que PPL/split.
function findVariantModels(currentExerciseNames) {
  const currentKey = getSessionMuscleKey(currentExerciseNames)
  if (!currentKey) return []

  return getAllModelsOnce().filter((model) => {
    const modelNames = model.exercises.map((e) => e.name)
    if (sameExerciseSet(modelNames, currentExerciseNames)) return false
    return getSessionMuscleKey(modelNames) === currentKey
  })
}

// Premier modèle-variante trouvé (voir findVariantModels ci-dessus), ou
// null s'il n'en existe aucun - utilisé par
// domain/program.js#getAlternateProgramProposal pour composer le
// programme 2 à partir du programme 1.
export function getFirstVariantModel(currentExerciseNames) {
  return findVariantModels(currentExerciseNames)[0] ?? null
}
