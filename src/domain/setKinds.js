// Série d'échauffement (warmup: true), ajoutée pendant l'exercice avant les
// séries de travail (voir pages/session-run/ExerciseView.jsx). Elle se
// valide comme une autre, mais ne compte dans AUCUN calcul : volume, carte
// musculaire, récupération, progression, records, dernière performance,
// suggestion de charge, nombre de séries affiché. Toute fonction de
// src/domain qui parcourt entry.sets pour calculer quelque chose passe par
// getWorkSets.
export function isWarmupSet(set) {
  return set?.warmup === true
}

export function getWorkSets(sets) {
  return sets.filter((set) => !isWarmupSet(set))
}

// Index de la première série de travail (= là où s'insère une nouvelle
// série d'échauffement), sets.length s'il n'y en a aucune.
export function getFirstWorkSetIndex(sets) {
  const index = sets.findIndex((set) => !isWarmupSet(set))
  return index === -1 ? sets.length : index
}
