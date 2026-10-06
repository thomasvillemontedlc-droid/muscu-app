export const SCHEMA_VERSION = 6

export function createEmptyData() {
  return {
    version: SCHEMA_VERSION,
    exercises: [],
    templates: [],
    sessions: [],
    // Jusqu'à deux programmes hebdomadaires (domain/program.js) qui
    // alternent si le second existe (voir `alternation` ci-dessous).
    // programs[0] ("Programme 1") est toujours présent ; programs[1]
    // ("Programme 2") vaut null tant qu'il n'a pas été composé - un seul
    // programme actif dans ce cas, pas d'alternance.
    programs: [{ templateIds: [] }, null],
    // Alternance entre les deux programmes, OPTIONNELLE (enabled, false par
    // défaut - voir pages/ProgramPage.jsx) : periodWeeks = nombre de
    // semaines passées sur chacun avant de basculer. startDate ancre le
    // calcul des semaines écoulées, posée à l'activation (ou réactivation)
    // de l'alternance, et à la composition du programme 2 si elle a lieu
    // après coup. Désactiver l'alternance ne touche ni programs[1] ni
    // startDate : le programme 2 reste composé, juste inactif.
    alternation: { enabled: false, periodWeeks: 4, startDate: null },
    // Séance choisie à la main comme "prochaine séance" (domain/program.js
    // #getNextTemplateOverrideId) : {templateId, setAt} ou null. Optionnel,
    // absent des données plus anciennes (traité comme null).
    nextTemplate: null,
    settings: {},
  }
}
