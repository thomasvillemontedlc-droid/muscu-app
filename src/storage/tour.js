const DISMISSED_KEY = 'muscu-app-tour-dismissed-steps'

// Étapes du parcours guidé explicitement ignorées via "Compris" (voir
// domain/tour.js#getCurrentTourStepId : une étape est aussi considérée
// accomplie si son action a réellement eu lieu, sans qu'on ait besoin de
// l'enregistrer ici). Séparé de storage.js/STORAGE_KEY car ce n'est pas une
// donnée de séance.
function readDismissed() {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

export function isStepDismissed(id) {
  return readDismissed().has(id)
}

export function dismissStep(id) {
  const dismissed = readDismissed()
  dismissed.add(id)
  localStorage.setItem(DISMISSED_KEY, JSON.stringify([...dismissed]))
}

// "Revoir le tutoriel" (Réglages) : oublie les étapes ignorées manuellement.
// Les étapes déjà accomplies par l'usage réel (première séance créée,
// programme existant...) ne peuvent pas être "rejouées" à l'identique —
// le parcours reprend au premier point encore réellement pertinent plutôt
// que de redemander l'impossible (ex. "crée ta première séance" alors
// qu'il y en a déjà dix).
export function resetTour() {
  localStorage.removeItem(DISMISSED_KEY)
}
