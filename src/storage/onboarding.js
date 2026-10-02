const WEEKLY_PROGRAM_DONE_KEY = 'muscu-app-weekly-program-onboarding-done'

// Une fois vrai, reste vrai pour toujours (voir App.jsx) : même si le
// programme est entièrement vidé plus tard, l'écran de choix de fréquence
// au tout premier lancement ne doit plus jamais s'imposer. La seule
// présence ACTUELLE de séances dans data.weeklyProgram.templateIds ne
// suffirait pas à garantir ça (elle peut redescendre à 0), d'où ce drapeau
// à part, comme storage/tour.js pour les étapes du parcours guidé ignorées.
export function hasCompletedWeeklyProgramOnboarding() {
  try {
    return localStorage.getItem(WEEKLY_PROGRAM_DONE_KEY) === 'true'
  } catch {
    return false
  }
}

export function markWeeklyProgramOnboardingComplete() {
  try {
    localStorage.setItem(WEEKLY_PROGRAM_DONE_KEY, 'true')
  } catch {
    // Stockage indisponible (navigation privée...) : tant pis, l'écran de
    // premier lancement pourra se réafficher au prochain lancement, ce qui
    // reste inoffensif (juste redondant).
  }
}
