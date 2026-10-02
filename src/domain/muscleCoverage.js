import { MUSCLE_GROUPS, getExerciseMuscles, getMuscleLabel } from './muscleGroups.js'
import { getCumulativeMuscleVolumes, getMuscleIntensities } from './muscleHeatmap.js'
import { getSessionStatus } from './sessions.js'

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
export function getTemplateMuscles(template, exercises) {
  const muscles = new Set()
  for (const exerciseId of template.exerciseIds) {
    const exercise = exercises.find((e) => e.id === exerciseId)
    if (!exercise) continue
    for (const muscleId of getExerciseMuscles(exercise.name).primary) muscles.add(muscleId)
  }
  return muscles
}

// Muscles PRINCIPAUX couverts par un programme hebdomadaire (union sur
// tous ses templates), vs ceux qu'aucune de ses séances ne travaille
// jamais — vérification structurelle du programme lui-même (domain/program.js),
// indépendante de tout historique de séances réelles (voir getMuscleCoverage
// ci-dessus pour la version basée sur ce qui a été effectivement fait).
export function getProgramMuscleCoverage(program, templates, exercises) {
  const covered = new Set()
  for (const templateId of program.templateIds) {
    const template = templates.find((t) => t.id === templateId)
    if (!template) continue
    for (const muscleId of getTemplateMuscles(template, exercises)) covered.add(muscleId)
  }
  return {
    covered: MUSCLE_GROUPS.filter((id) => covered.has(id)),
    uncovered: MUSCLE_GROUPS.filter((id) => !covered.has(id)),
  }
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

// Fenêtre d'analyse du déséquilibre long terme ci-dessous : nombre de
// séances entraînées (statut 'done' ou 'partial', jamais 'not-done' - une
// séance jamais vraiment commencée ne dit rien sur ce qui a été travaillé)
// prises en compte, et minimum requis avant de considérer qu'il y a assez de
// recul pour conclure à quoi que ce soit.
const LONG_TERM_WINDOW_SIZE = 20
const MIN_SESSIONS_FOR_LONG_TERM_ANALYSIS = 15

// Un muscle est jugé "à la base peu/pas sollicité" s'il reste à 15% ou moins
// de l'intensité du muscle le plus travaillé sur la fenêtre (même échelle
// 0..1 que la carte de chaleur, voir muscleHeatmap.js#getMuscleIntensities)
// - un seuil bas exprès, qui ne remonte que les cas nets (quasi éteints sur
// ta propre carte de chaleur pour cette période), pas un muscle simplement
// un peu moins mis à contribution que les autres.
const UNDERWORKED_INTENSITY_THRESHOLD = 0.15

// Séances effectivement entraînées, les plus récentes en premier.
function getTrainedSessions(sessions) {
  return [...sessions]
    .filter((s) => getSessionStatus(s) !== 'not-done')
    .sort((a, b) => b.date.localeCompare(a.date))
}

// Muscles négligés sur le LONG terme (les 20 dernières séances entraînées,
// pas seulement la période affichée dans Progression) : contrairement à
// getMuscleCoverage ci-dessus (0 de volume = "pas du tout sollicité"), vise
// les muscles qui reçoivent bien QUELQUE chose mais très peu comparé au
// reste de ce qui est entraîné - un déséquilibre structurel du programme
// plutôt qu'un simple trou de cette semaine. Ne retourne rien tant qu'il n'y
// a pas assez de séances pour que ce soit significatif (voir
// MIN_SESSIONS_FOR_LONG_TERM_ANALYSIS) ; ne propose jamais de réduire un
// muscle déjà bien travaillé, seulement d'en ajouter pour ceux en-dessous du
// seuil (voir suggestSessionsForMissingMuscles, réutilisé tel quel).
export function getLongTermMuscleImbalance(sessions, templates, exercises) {
  const trained = getTrainedSessions(sessions).slice(0, LONG_TERM_WINDOW_SIZE)
  if (trained.length < MIN_SESSIONS_FOR_LONG_TERM_ANALYSIS) {
    return { sessionCount: trained.length, underworked: [], suggestions: [], uncovered: [] }
  }

  const intensities = getMuscleIntensities(getCumulativeMuscleVolumes(trained))
  const underworkedIds = MUSCLE_GROUPS.filter((id) => (intensities[id] ?? 0) <= UNDERWORKED_INTENSITY_THRESHOLD)
  const { suggestions, uncovered } = suggestSessionsForMissingMuscles(templates, exercises, underworkedIds)

  return {
    sessionCount: trained.length,
    underworked: underworkedIds.map((id) => ({ id, label: getMuscleLabel(id) })),
    suggestions,
    uncovered,
  }
}
