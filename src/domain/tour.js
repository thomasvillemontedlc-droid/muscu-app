import { isStepDismissed } from '../storage/tour.js'

// Parcours guidé dans l'ordre réel d'utilisation (créer une séance, en
// créer une deuxième, lancer une séance, la terminer, consulter
// Progression puis Historique, mettre en place un programme et sa
// rotation, exporter) : une seule étape "courante" à la fois, chacune ne
// s'affiche que si toutes celles d'avant sont accomplies. `isDataComplete`
// est optionnel — quand présent, l'étape se termine automatiquement dès
// que l'action décrite a réellement eu lieu (ex. une deuxième séance type
// existe), sans attendre un clic sur "Compris" ; les autres étapes,
// purement informatives, ne se terminent que par ce clic (voir
// storage/tour.js#dismissStep). Un id ci-dessous doit correspondre à un
// <TourStep id="..."> quelque part dans l'app (voir components/TourStep.jsx).
export const TOUR_STEPS = [
  { id: 'create-first-session', isDataComplete: (data) => data.templates.length >= 1 },
  { id: 'create-second-session', isDataComplete: (data) => data.templates.length >= 2 },
  { id: 'warmup-customize' },
  { id: 'exercise-input' },
  { id: 'exercise-flow' },
  { id: 'rest-adjust' },
  { id: 'stretches' },
  { id: 'progress-heatmap' },
  { id: 'history-status' },
  // La séance de fréquence (assistant "Combien de séances par semaine ?")
  // disparaît une fois le programme construit, par un autre biais que
  // l'assistant lui-même (ajout manuel) : sans ce repli, l'étape resterait
  // bloquée pour de bon si son propre écran n'est jamais revu.
  { id: 'program-frequency', isDataComplete: (data) => data.weeklyProgram.templateIds.length > 0 },
  { id: 'program-rotation' },
  { id: 'settings-export' },
]

function isStepComplete(step, data) {
  return isStepDismissed(step.id) || (step.isDataComplete?.(data) ?? false)
}

// Id de la prochaine étape à afficher, ou null si le parcours est terminé.
export function getCurrentTourStepId(data) {
  return TOUR_STEPS.find((step) => !isStepComplete(step, data))?.id ?? null
}
