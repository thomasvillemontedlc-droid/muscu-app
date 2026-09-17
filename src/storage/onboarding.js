const ONBOARDING_KEY = 'muscu-app-onboarding-seen'

// Séparé de storage.js/STORAGE_KEY : ce flag suit uniquement si le tutoriel
// a déjà été vu sur cet appareil, indépendamment des données de séances
// (donc pas concerné par export/import ou réinitialisation du catalogue).
export function hasSeenOnboarding() {
  return localStorage.getItem(ONBOARDING_KEY) === 'true'
}

export function markOnboardingSeen() {
  localStorage.setItem(ONBOARDING_KEY, 'true')
}
