import { MUSCLE_GROUPS, getExerciseMuscles, getMuscleLabel } from './muscleGroups.js'
import { getCumulativeMuscleVolumes } from './muscleHeatmap.js'

// Muscles travaillés (volume > 0, principal ou secondaire à moitié — même
// pondération que la carte de chaleur, voir muscleHeatmap.js) vs pas du
// tout sollicités sur la période, dans l'ordre standard MUSCLE_GROUPS.
export function getMuscleCoverage(sessionsInPeriod) {
  const volumes = getCumulativeMuscleVolumes(sessionsInPeriod)
  const worked = MUSCLE_GROUPS.filter((id) => (volumes[id] ?? 0) > 0)
  const missing = MUSCLE_GROUPS.filter((id) => !(volumes[id] > 0))
  return { worked, missing }
}

// Muscles PRINCIPAUX couverts par une séance type, à partir de ses
// exercices : un template n'a pas de séries réalisées à filtrer (contrairement
// à une séance), juste une liste d'exercices dont on prend le muscle
// principal (voir domain/muscleGroups.js#getExerciseMuscles).
function getTemplateMuscles(template, exercises) {
  const muscles = new Set()
  for (const exerciseId of template.exerciseIds) {
    const exercise = exercises.find((e) => e.id === exerciseId)
    if (!exercise) continue
    for (const muscleId of getExerciseMuscles(exercise.name).primary) muscles.add(muscleId)
  }
  return muscles
}

// Sélection gloutonne des séances types qui couvrent le mieux les muscles
// manquants : à chaque tour, celle qui couvre le plus de muscles manquants
// RESTANTS est retenue, jusqu'à couverture complète ou épuisement des
// séances utiles. Les muscles qu'aucune séance existante ne couvre sont
// renvoyés à part (`uncovered`) plutôt que de forcer une suggestion inutile.
export function suggestSessionsForMissingMuscles(templates, exercises, missingMuscleIds) {
  const remaining = new Set(missingMuscleIds)
  const candidates = templates.map((template) => ({ template, muscles: getTemplateMuscles(template, exercises) }))
  const suggestions = []

  while (remaining.size > 0) {
    let best = null
    let bestCovers = []

    for (const { template, muscles } of candidates) {
      if (suggestions.some((s) => s.template.id === template.id)) continue
      const covers = [...remaining].filter((id) => muscles.has(id))
      if (covers.length > bestCovers.length) {
        best = template
        bestCovers = covers
      }
    }

    if (!best) break
    suggestions.push({ template: best, covers: bestCovers.map((id) => ({ id, label: getMuscleLabel(id) })) })
    for (const id of bestCovers) remaining.delete(id)
  }

  return {
    suggestions,
    uncovered: [...remaining].map((id) => ({ id, label: getMuscleLabel(id) })),
  }
}
