const SEEN_TIPS_KEY = 'muscu-app-onboarding-tips-seen'

// Une bulle par écran/fonctionnalité, chacune vue indépendamment (voir
// components/OnboardingTip.jsx) : pas de séquence à suivre dans l'ordre, la
// première visite de chaque écran suffit à déclencher sa bulle. Séparé de
// storage.js/STORAGE_KEY car ce n'est pas une donnée de séance.
function readSeenTips() {
  try {
    const raw = localStorage.getItem(SEEN_TIPS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function hasSeenTip(id) {
  return readSeenTips()[id] === true
}

export function markTipSeen(id) {
  const seen = readSeenTips()
  seen[id] = true
  localStorage.setItem(SEEN_TIPS_KEY, JSON.stringify(seen))
}

// "Revoir le tutoriel" (Réglages) : oublie tout, chaque bulle réapparaîtra à
// la prochaine visite de son écran plutôt que toutes d'un coup.
export function resetSeenTips() {
  localStorage.removeItem(SEEN_TIPS_KEY)
}
