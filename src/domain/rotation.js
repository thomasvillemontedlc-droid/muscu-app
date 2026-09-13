import { getExerciseMuscles, getSeedExercises } from './muscleGroups.js'
import { getOrCreateExercise } from './exercises.js'

// Ensemble des muscles principaux d'un exercice, comme clé de comparaison
// (triée pour que l'ordre n'ait pas d'importance). Chaîne vide si l'exercice
// n'a pas de muscle détecté (nom hors base, voir domain/muscleGroups.js) :
// on ne propose alors aucun remplacement plutôt qu'un mauvais.
function getPrimaryMuscleKey(name) {
  return [...getExerciseMuscles(name).primary].sort().join(',')
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

// Propose une nouvelle version de chaque séance du programme : mêmes
// groupes musculaires par exercice, mais des exercices différents de ceux
// du bloc en cours (voir pickReplacement). Ne modifie rien : c'est une
// proposition à valider, éventuellement éditée avant application (voir
// applyRotationProposal et ProgramPage.jsx) — jamais appliquée seule.
export function proposeRotation(program, templates, exercises) {
  return program.templateIds
    .map((templateId) => templates.find((t) => t.id === templateId))
    .filter(Boolean)
    .map((template) => {
      const currentNames = template.exerciseIds
        .map((id) => exercises.find((e) => e.id === id)?.name)
        .filter(Boolean)
      const excludeNames = new Set(currentNames)

      const proposedNames = currentNames.map((name) => {
        const replacement = pickReplacement(name, excludeNames)
        excludeNames.add(replacement)
        return replacement
      })

      return { templateId: template.id, templateName: template.name, currentNames, proposedNames }
    })
}

// Applique une proposition (éventuellement éditée par l'utilisateur) :
// crée/retrouve chaque exercice proposé dans le catalogue (comme un ajout
// manuel, voir domain/exercises.js#getOrCreateExercise), puis remplace la
// liste d'exercices du template EN PLACE — même id, même nom de séance.
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
