import { getLastPerformance } from './history.js'
import { getEffectiveWeightStep } from './exercises.js'

const POSITIVE_FEELINGS = new Set(['ok', 'facile'])

// Suggestion de hausse de charge pour un exercice, basée sur sa dernière
// fois : toutes les séries doivent avoir atteint leur objectif (set.reps >=
// set.targetReps, figé au pré-remplissage — voir domain/sessions.js#withTarget),
// ET le ressenti saisi ce jour-là doit être "ok" (Bien comme ça) ou
// "facile". Une série sans targetReps connu (donnée d'avant ce champ, ou
// jamais fait) fait échouer la condition plutôt que de risquer un faux
// positif — elle se corrigera d'elle-même dès la prochaine vraie séance.
// Le montant de la hausse réutilise le même pas que les boutons +/-
// (getEffectiveWeightStep), jamais un calcul indépendant.
export function getChargeSuggestion(otherSessions, exerciseId, exercise) {
  const last = getLastPerformance(otherSessions, exerciseId)
  if (!last) return null

  const feelingValue = last.feeling?.value
  if (!POSITIVE_FEELINGS.has(feelingValue)) return null

  const allSetsHitTarget = last.sets.every((set) => set.targetReps != null && set.reps >= set.targetReps)
  if (!allSetsHitTarget) return null

  const currentWeight = last.sets[0]?.weight ?? 0
  const step = getEffectiveWeightStep(exercise)
  const newWeight = Math.round((currentWeight + step) * 100) / 100

  return { currentWeight, newWeight, step, feelingValue }
}
